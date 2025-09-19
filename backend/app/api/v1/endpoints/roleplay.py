from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import datetime
import uuid
from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
import logging

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.models import RoleplayScenario, RoleplayAdvice, RoleplaySession, Child, User
from app.schemas import (
    RoleplayScenarioResponse, 
    RoleplayAdviceResponse, 
    RoleplaySessionRequest, 
    RoleplaySessionResponse,
    RoleplaySessionUpdateRequest
)
from app.api.v1.endpoints.auth import get_current_user

# データベース接続を直接定義
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)
async_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_db():
    async with async_session_local() as session:
        yield session


@router.get(
    "/scenarios",
    response_model=List[RoleplayScenarioResponse],
    summary="ロールプレイシナリオ一覧取得",
    description="アクティブなロールプレイシナリオの一覧を取得します。年齢範囲や難易度でフィルタリング可能です。",
)
async def get_roleplay_scenarios(
    db: AsyncSession = Depends(get_db),
    child_age: Optional[int] = None,
    difficulty_level: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
):
    """ロールプレイシナリオの一覧を取得"""
    try:
        # 基本クエリ：アクティブなシナリオのみ
        query = select(RoleplayScenario).where(RoleplayScenario.is_active == True)
        
        # 年齢フィルタリング
        if child_age:
            query = query.where(
                and_(
                    RoleplayScenario.age_range_min <= child_age,
                    RoleplayScenario.age_range_max >= child_age
                )
            )
        
        # 難易度フィルタリング
        if difficulty_level:
            query = query.where(RoleplayScenario.difficulty_level == difficulty_level)
        
        # ソートとページネーション
        query = query.order_by(RoleplayScenario.sort_order.asc()).limit(limit).offset(offset)
        
        result = await db.execute(query)
        scenarios = result.scalars().all()
        
        logger.info(f"シナリオ一覧取得: {len(scenarios)}件")
        return scenarios
        
    except Exception as e:
        logger.error(f"シナリオ一覧取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch scenarios: {str(e)}")


@router.get(
    "/scenarios/{scenario_id}",
    response_model=RoleplayScenarioResponse,
    summary="ロールプレイシナリオ詳細取得",
    description="指定されたシナリオの詳細情報を取得します。",
)
async def get_roleplay_scenario(
    scenario_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """ロールプレイシナリオの詳細を取得"""
    try:
        result = await db.execute(
            select(RoleplayScenario).where(RoleplayScenario.id == scenario_id)
        )
        scenario = result.scalar_one_or_none()
        
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        if not scenario.is_active:
            raise HTTPException(status_code=404, detail="Scenario is not active")
        
        logger.info(f"シナリオ詳細取得: {scenario.title}")
        return scenario
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"シナリオ詳細取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch scenario: {str(e)}")


@router.get(
    "/advice",
    response_model=List[RoleplayAdviceResponse],
    summary="ロールプレイアドバイス取得",
    description="シナリオIDと感情IDを指定して、対応するアドバイスを取得します。",
)
async def get_roleplay_advice(
    scenario_id: UUID,
    emotion_id: str,
    db: AsyncSession = Depends(get_db),
):
    """ロールプレイアドバイスを取得"""
    try:
        result = await db.execute(
            select(RoleplayAdvice).where(
                and_(
                    RoleplayAdvice.scenario_id == scenario_id,
                    RoleplayAdvice.emotion_id == emotion_id
                )
            )
        )
        advice_list = result.scalars().all()
        
        if not advice_list:
            # デフォルトアドバイスを返す
            default_advice = {
                "kanashii": "「かなしいよ」って いってみよう",
                "komatta": "「どうしたらいい？」って\nきいてみよう",
                "fuyukai": "「いやだな」って いってみよう",
                "ikari": "いきを「すーっ」「はーっ」と\nゆっくりしてみよう",
            }
            
            default_text = default_advice.get(emotion_id, "一緒に考えてみよう")
            
            # 仮想的なアドバイスレスポンスを作成
            return [RoleplayAdviceResponse(
                id=uuid.uuid4(),
                scenario_id=scenario_id,
                emotion_id=emotion_id,
                advice_text=default_text,
                advice_type="general",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )]
        
        logger.info(f"アドバイス取得: {len(advice_list)}件")
        return advice_list
        
    except Exception as e:
        logger.error(f"アドバイス取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch advice: {str(e)}")


@router.post(
    "/sessions",
    response_model=RoleplaySessionResponse,
    summary="ロールプレイセッション作成",
    description="新しいロールプレイセッションを作成します。",
)
async def create_roleplay_session(
    request: RoleplaySessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ロールプレイセッションを作成"""
    try:
        # 子供の権限チェック
        child = await db.get(Child, request.child_id)
        if not child or child.user_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="この子供のロールプレイセッションを作成する権限がありません"
            )
        
        # シナリオの存在チェック
        scenario = await db.get(RoleplayScenario, request.scenario_id)
        if not scenario or not scenario.is_active:
            raise HTTPException(status_code=404, detail="Scenario not found or not active")
        
        # セッション作成
        session = RoleplaySession(
            user_id=current_user.id,
            child_id=request.child_id,
            scenario_id=request.scenario_id,
            emotion_log_id=request.emotion_log_id,
            selected_emotion_id=request.selected_emotion_id,
            completion_status="started"
        )
        
        db.add(session)
        await db.commit()
        await db.refresh(session)
        
        logger.info(f"ロールプレイセッション作成: {session.id}")
        return session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"セッション作成エラー: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@router.put(
    "/sessions/{session_id}",
    response_model=RoleplaySessionResponse,
    summary="ロールプレイセッション更新",
    description="ロールプレイセッションの情報を更新します。",
)
async def update_roleplay_session(
    session_id: UUID,
    request: RoleplaySessionUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ロールプレイセッションを更新"""
    try:
        # セッションの存在と権限チェック
        result = await db.execute(
            select(RoleplaySession).where(RoleplaySession.id == session_id)
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="このセッションを更新する権限がありません")
        
        # 更新データの適用
        if request.session_duration is not None:
            session.session_duration = request.session_duration
        
        if request.completion_status is not None:
            session.completion_status = request.completion_status
            if request.completion_status == "completed":
                session.completed_at = datetime.now()
        
        if request.user_rating is not None:
            session.user_rating = request.user_rating
        
        if request.user_feedback is not None:
            session.user_feedback = request.user_feedback
        
        await db.commit()
        await db.refresh(session)
        
        logger.info(f"ロールプレイセッション更新: {session.id}")
        return session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"セッション更新エラー: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update session: {str(e)}")


@router.get(
    "/sessions",
    response_model=List[RoleplaySessionResponse],
    summary="ロールプレイセッション一覧取得",
    description="ユーザーのロールプレイセッション一覧を取得します。",
)
async def get_roleplay_sessions(
    child_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ロールプレイセッション一覧を取得"""
    try:
        # 基本クエリ：ユーザーのセッションのみ
        query = select(RoleplaySession).where(RoleplaySession.user_id == current_user.id)
        
        # 子供フィルタリング
        if child_id:
            query = query.where(RoleplaySession.child_id == child_id)
        
        # ソートとページネーション
        query = query.order_by(RoleplaySession.created_at.desc()).limit(limit).offset(offset)
        
        result = await db.execute(query)
        sessions = result.scalars().all()
        
        logger.info(f"セッション一覧取得: {len(sessions)}件")
        return sessions
        
    except Exception as e:
        logger.error(f"セッション一覧取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch sessions: {str(e)}")


@router.get(
    "/sessions/{session_id}",
    response_model=RoleplaySessionResponse,
    summary="ロールプレイセッション詳細取得",
    description="指定されたロールプレイセッションの詳細情報を取得します。",
)
async def get_roleplay_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ロールプレイセッションの詳細を取得"""
    try:
        result = await db.execute(
            select(RoleplaySession).where(RoleplaySession.id == session_id)
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="このセッションを表示する権限がありません")
        
        logger.info(f"セッション詳細取得: {session.id}")
        return session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"セッション詳細取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch session: {str(e)}")
