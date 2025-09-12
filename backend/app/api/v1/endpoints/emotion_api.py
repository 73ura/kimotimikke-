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
from functools import lru_cache
import logging

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.models import EmotionCard, Intensity, EmotionLog, Child, User
from app.schemas import ChildResponse, EmotionLogResponse
from app.api.v1.endpoints.auth import get_current_user

# データベース接続を直接定義
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)
async_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def get_db():
    async with async_session_local() as session:
        yield session


router = APIRouter(prefix="/emotion", tags=["emotion"])

# ログ設定
logger = logging.getLogger(__name__)


# 感情記録作成用リクエストモデル（段階的保存対応）
class CreateEmotionLogRequest(BaseModel):
    # user_idは削除（認証されたユーザーから取得）
    child_id: str = Field(..., description="子供のID（文字列）")
    emotion_card_id: str = Field(..., description="感情カードID（文字列）")
    intensity_id: int = Field(..., description="強度ID (1/2/3 等)")
    voice_note: str | None = None
    text_file_path: str | None = None
    audio_file_path: str | None = None


@router.get(
    "/cards",
    summary="感情カード一覧取得",
    description="""
    感情選択画面で使用する感情カードの一覧をDBから取得します。

    ## 使用タイミング
    - 感情選択画面の初期表示時
    - 感情カードの表示用データ取得時

    ## レスポンス例
    ```json
    {
      "success": true,
      "cards": [
        {
          "id": "8f5e4f8a-0e2f-4a2b-9dc3-6a4b1b3f4e12",
          "label": "うれしい",
          "image_url": "/images/emotions/ureshii.webp",
          "color": "#FFCC00"
        }
      ]
    }
    ```

    ## 取得情報
    - `id`: UUID文字列
    - `label`: 感情名
    - `image_url`: 画像パス
    - `color`: ベースカラー（HEX）
    """,
    response_description="感情カード一覧を返します",
)
async def get_emotion_cards(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(EmotionCard))
        cards = result.scalars().all()
        return {
            "success": True,
            "cards": [
                {
                    "id": str(card.id),
                    "label": card.label,
                    "image_url": card.image_url,
                    "color": card.color,
                }
                for card in cards
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/intensities",
    summary="強度一覧取得",
    description="""
    感情の強度レベル一覧をDBから取得します。

    ## 使用タイミング
    - 強度選択UIの初期表示時
    - 強度選択用データ取得時

    ## レスポンス例
    ```json
    {
      "success": true,
      "intensities": [
        { "id": 1, "color_modifier": 0.4 },
        { "id": 2, "color_modifier": 0.7 },
        { "id": 3, "color_modifier": 1.0 }
      ]
    }
    ```

    ## 取得情報
    - `id`: 強度ID（1, 2, 3 ...）
    - `color_modifier`: 透明度（0.0-1.0）。例: 0.7 → RGBAのalpha 0.7 相当
    """,
    response_description="強度一覧を返します",
)
async def get_intensities(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Intensity))
        intensities = result.scalars().all()
        return {
            "success": True,
            "intensities": [
                {"id": intensity.id, "color_modifier": intensity.color_modifier / 100}
                for intensity in intensities
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/logs",
    summary="感情記録作成（段階的保存）",
    description="""
    感情カードと強度の選択のみをDBに保存します。音声・テキスト関連のデータは後で音声入力画面で更新されます。

    ## 使用フロー
    1. `/emotion/cards` と `/emotion/intensities` で選択候補を取得
    2. 前端でカードと強度を選択
    3. 本APIにPOSTして感情記録を作成
    4. 後で音声入力画面で音声・テキストデータを追加

    ## リクエスト例（JSON）
    ```json
    {
      "child_id": "child456",
      "emotion_card_id": "ureshii",
      "intensity_id": 2
    }
    ```

    ## レスポンス例
    ```json
    {
      "success": true,
      "log_id": "emotion_log_123",
      "message": "Emotion log created successfully"
    }
    ```

    ## 必須項目
    - `child_id`: 子供のID
    - `emotion_card_id`: 感情カードID
    - `intensity_id`: 強度ID (1/2/3)
    
    ## 認証
    - ユーザーIDは認証トークンから自動取得

    ## オプショナル項目
    - `voice_note`: 音声メモ（後で音声入力画面で更新）
    - `text_file_path`: テキストファイルのS3パス（後で音声入力画面で更新）
    - `audio_file_path`: 音声ファイルのS3パス（後で音声入力画面で更新）

    ## 注意事項
    - 音声・テキスト関連のフィールドは送信不要
    - 後で音声入力画面でこれらのデータが追加される
    """,
    response_description="感情記録保存結果を返します",
)
async def create_emotion_log(
    request: CreateEmotionLogRequest,
    current_user: User = Depends(get_current_user),  # 認証必須
    db: AsyncSession = Depends(get_db),
):
    try:
        # LOG: 感情記録作成開始
        logger.info(
            f"感情記録作成開始 - ユーザーID: {current_user.id}, 子供ID: {request.child_id}, 感情ID: {request.emotion_card_id}"
        )

        # SECURITY: 認証されたユーザーのIDを使用（request.user_idは無視してセキュリティを確保）
        user_id = current_user.id

        # SECURITY: 選択された子供が自分の子供かチェック（他のユーザーの子供への感情記録作成を防止）
        child = await db.get(Child, uuid.UUID(request.child_id))
        if not child or child.user_id != user_id:
            logger.warning(
                f"権限なしアクセス試行 - ユーザーID: {user_id}, 子供ID: {request.child_id}"
            )
            raise HTTPException(
                status_code=403, detail="この子供の感情記録を作成する権限がありません"
            )

        # 感情記録を作成（音声・テキスト関連は後で更新）
        emotion_log = EmotionLog(
            user_id=user_id,
            child_id=uuid.UUID(request.child_id),
            emotion_card_id=uuid.UUID(request.emotion_card_id),
            intensity_id=request.intensity_id,
            voice_note=request.voice_note,
            text_file_path=request.text_file_path,
            audio_file_path=request.audio_file_path,
        )

        db.add(emotion_log)
        await db.commit()
        await db.refresh(emotion_log)

        # LOG: 感情記録作成成功
        logger.info(
            f"感情記録作成成功 - 記録ID: {emotion_log.id}, ユーザーID: {user_id}"
        )

        return {
            "success": True,
            "log_id": str(emotion_log.id),
            "message": "Emotion log created successfully",
        }

    except HTTPException:
        # HTTPExceptionは再発生（ログは既に記録済み）
        raise
    except Exception as e:
        # LOG: 予期しないエラー
        logger.error(
            f"感情記録作成エラー - ユーザーID: {current_user.id}, エラー: {str(e)}",
            exc_info=True,
        )
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/logs/list",
    response_model=List[EmotionLogResponse],
    summary="感情ログ一覧取得",
    description="ユーザーに紐づく感情ログを取得します。child_idが指定された場合は、その子どものログのみを取得します。",
)
async def get_emotion_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    child_id: Optional[str] = None,
    limit: int = 50,  # PERFORMANCE: デフォルト値を50に削減（メモリ使用量削減）
    offset: int = 0,
):
    try:
        # PERFORMANCE: クエリの構築（selectinloadでN+1問題を回避）
        query = (
            select(EmotionLog)
            .options(
                selectinload(EmotionLog.emotion_card),
                selectinload(EmotionLog.intensity),
            )
            .where(EmotionLog.user_id == current_user.id)
        )

        if child_id:
            query = query.where(EmotionLog.child_id == child_id)

        query = query.order_by(EmotionLog.created_at.desc()).limit(limit).offset(offset)

        result = await db.execute(query)
        emotion_logs = result.scalars().all()

        return emotion_logs

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch emotion logs: {str(e)}"
        )


@router.get(
    "/logs/daily/{date}",
    response_model=List[EmotionLogResponse],
    summary="指定日の感情ログ取得",
    description="指定された日付の感情ログを取得します。日付はYYYY-MM-DD形式で指定してください。",
)
async def get_emotion_logs_by_date(
    date: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    child_id: Optional[str] = None,
):
    try:
        # NOTE: 日付文字列をパース（YYYY-MM-DD形式）
        target_date = datetime.strptime(date, "%Y-%m-%d").date()

        # クエリの構築
        query = (
            select(EmotionLog)
            .options(
                selectinload(EmotionLog.emotion_card),
                selectinload(EmotionLog.intensity),
            )
            .where(
                and_(
                    EmotionLog.user_id == current_user.id,
                    EmotionLog.created_at
                    >= datetime.combine(target_date, datetime.min.time()),
                    EmotionLog.created_at
                    < datetime.combine(target_date, datetime.max.time()),
                )
            )
        )

        if child_id:
            query = query.where(EmotionLog.child_id == child_id)

        query = query.order_by(EmotionLog.created_at.desc())

        result = await db.execute(query)
        emotion_logs = result.scalars().all()

        return emotion_logs

    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch emotion logs: {str(e)}"
        )


@router.get(
    "/logs/monthly/{year}/{month}",
    response_model=List[EmotionLogResponse],
    summary="指定月の感情ログ取得",
    description="指定された年月の感情ログを取得します。",
)
async def get_emotion_logs_by_month(
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    child_id: Optional[str] = None,
):
    try:
        # NOTE: 月の開始日と終了日を計算（12月の場合は翌年1月を考慮）
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)

        # クエリの構築
        query = (
            select(EmotionLog)
            .options(
                selectinload(EmotionLog.emotion_card),
                selectinload(EmotionLog.intensity),
            )
            .where(
                and_(
                    EmotionLog.user_id == current_user.id,
                    EmotionLog.created_at >= start_date,
                    EmotionLog.created_at < end_date,
                )
            )
        )

        if child_id:
            query = query.where(EmotionLog.child_id == child_id)

        query = query.order_by(EmotionLog.created_at.desc())

        result = await db.execute(query)
        emotion_logs = result.scalars().all()

        return emotion_logs

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch emotion logs: {str(e)}"
        )


@router.get(
    "/children",
    summary="認証されたユーザーの子供一覧取得",
    description="""
    認証されたユーザーに紐づく子供の一覧を取得します。

    ## 使用タイミング
    - 感情記録作成時の子供選択
    - ユーザー設定画面での子供一覧表示

    ## レスポンス例
    ```json
    {
      "success": true,
      "children": [
        {
          "id": "327155de-a775-4847-aba9-abbd352d740d",
          "nickname": "テストくん",
          "birth_date": "2018-04-15",
          "gender": "男の子",
          "user_id": "user-uuid",
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
    ```
    """,
    response_description="認証されたユーザーの子供一覧を返します",
)
async def get_user_children(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    try:
        # 認証されたユーザーに紐づく子供を取得
        result = await db.execute(select(Child).where(Child.user_id == current_user.id))
        children = result.scalars().all()

        return {
            "success": True,
            "children": [
                ChildResponse(
                    id=child.id,
                    nickname=child.nickname,
                    birth_date=child.birth_date.isoformat(),
                    gender=child.gender,
                    user_id=child.user_id,
                    created_at=child.created_at,
                    updated_at=child.updated_at,
                )
                for child in children
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
