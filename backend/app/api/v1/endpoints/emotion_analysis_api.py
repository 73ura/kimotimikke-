"""
感情パターン分析API

感情記録を分析して、親にフィードバックを提供するAPI
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models import User
from app.api.v1.dependencies import get_current_user
from app.services.emotion_analysis import EmotionAnalysisService
from app.schemas import EmotionAnalysisResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/emotion-analysis", tags=["emotion-analysis"])


@router.get(
    "/child/{child_id}",
    response_model=EmotionAnalysisResponse,
    summary="子供の感情パターン分析",
    description="""
    指定された子供の感情記録を分析して、親向けのフィードバックを提供します。

    ## 分析内容
    - 感情の頻度分布
    - 強度の分布
    - 時間帯別パターン
    - 週間パターン
    - 感情のトレンド変化
    - 親向けの具体的なフィードバック

    ## パラメータ
    - `child_id`: 分析対象の子供のID
    - `days`: 分析期間（日数、デフォルト: 30日）
    - `include_insights`: 詳細な洞察を含むか（デフォルト: true）

    ## レスポンス例
    ```json
    {
      "child_id": "child-123",
      "child_name": "たろう",
      "analysis_period": "過去30日間",
      "total_records": 45,
      "emotion_frequencies": [
        {
          "emotion_id": "emotion-1",
          "emotion_label": "うれしい",
          "count": 15,
          "percentage": 33.3,
          "color": "#FFCC00"
        }
      ],
      "intensity_distribution": [
        {
          "intensity_id": 1,
          "count": 10,
          "percentage": 22.2
        }
      ],
      "weekly_patterns": [
        {
          "day_of_week": 0,
          "emotion_counts": {"emotion-1": 5, "emotion-2": 2}
        }
      ],
      "emotion_trends": [
        {
          "emotion_id": "emotion-1",
          "emotion_label": "うれしい",
          "trend": "increasing",
          "change_percentage": 25.0
        }
      ],
      "feedback": {
        "summary": "お子さんの感情記録を45件分析しました。",
        "insights": [
          "最も多く記録された感情は「うれしい」です（33.3%）",
          "朝の時間帯により多くの感情記録があります"
        ],
        "recommendations": [
          "朝の時間を大切に、お子さんの気持ちに寄り添ってあげてください",
          "感情が高ぶっている時は、落ち着くための時間を作ってあげてください"
        ],
        "positive_aspects": [
          "「うれしい」の感情が多く見られ、お子さんは前向きな気持ちで過ごしているようです"
        ],
        "areas_for_attention": []
      },
      "analysis_date": "2024-01-15",
      "confidence_score": 0.9
    }
    ```

    ## 認証
    - 認証されたユーザーのみアクセス可能
    - 自分の子供のデータのみ分析可能

    ## エラー
    - 404: 子供が見つからない場合
    - 403: 権限がない場合
    - 500: 分析処理エラー
    """,
    response_description="感情パターン分析結果を返します",
)
async def analyze_child_emotions(
    child_id: str,
    days: int = Query(30, ge=1, le=365, description="分析期間（日数）"),
    include_insights: bool = Query(True, description="詳細な洞察を含むか"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    子供の感情パターンを分析
    
    Args:
        child_id: 分析対象の子供のID
        days: 分析期間（日数）
        include_insights: 詳細な洞察を含むか
        current_user: 認証されたユーザー
        db: データベースセッション
        
    Returns:
        EmotionAnalysisResponse: 分析結果
    """
    try:
        logger.info(
            f"感情パターン分析開始 - ユーザーID: {current_user.id}, 子供ID: {child_id}, 期間: {days}日"
        )
        
        # 感情分析サービスを初期化
        analysis_service = EmotionAnalysisService(db)
        
        # 感情パターンを分析
        analysis_result = await analysis_service.analyze_emotion_patterns(
            child_id=child_id,
            user_id=str(current_user.id),
            days=days
        )
        
        logger.info(
            f"感情パターン分析完了 - 子供ID: {child_id}, 記録数: {analysis_result.total_records}"
        )
        
        return analysis_result
        
    except ValueError as e:
        logger.warning(f"感情パターン分析エラー（データなし）: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"感情パターン分析エラー: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="感情パターン分析に失敗しました")


@router.get(
    "/summary",
    summary="感情分析サマリー取得",
    description="""
    ユーザーの全子供の感情分析サマリーを取得します。
    各子供の主要な感情とトレンドを簡潔に表示します。
    """,
)
async def get_emotion_analysis_summary(
    days: int = Query(30, ge=1, le=365, description="分析期間（日数）"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    感情分析サマリーを取得
    
    Args:
        days: 分析期間（日数）
        current_user: 認証されたユーザー
        db: データベースセッション
        
    Returns:
        dict: 各子供の感情分析サマリー
    """
    try:
        logger.info(f"感情分析サマリー取得開始 - ユーザーID: {current_user.id}, 期間: {days}日")
        
        # 感情分析サービスを初期化
        analysis_service = EmotionAnalysisService(db)
        
        # ユーザーの子供一覧を取得
        from app.crud import get_children_by_user_id
        children = await get_children_by_user_id(db, current_user.id)
        
        if not children:
            return {
                "message": "子供のデータが見つかりません",
                "children_analysis": []
            }
        
        # 各子供の分析結果を取得
        children_analysis = []
        for child in children:
            try:
                analysis_result = await analysis_service.analyze_emotion_patterns(
                    child_id=str(child.id),
                    user_id=str(current_user.id),
                    days=days
                )
                
                # サマリー情報のみ抽出
                summary = {
                    "child_id": str(child.id),
                    "child_name": child.nickname,
                    "total_records": analysis_result.total_records,
                    "top_emotion": analysis_result.emotion_frequencies[0] if analysis_result.emotion_frequencies else None,
                    "confidence_score": analysis_result.confidence_score,
                    "feedback_summary": analysis_result.feedback.summary
                }
                children_analysis.append(summary)
                
            except Exception as e:
                logger.warning(f"子供 {child.id} の分析でエラー: {e}")
                children_analysis.append({
                    "child_id": str(child.id),
                    "child_name": child.nickname,
                    "error": "分析に失敗しました"
                })
        
        logger.info(f"感情分析サマリー取得完了 - 子供数: {len(children_analysis)}")
        
        return {
            "analysis_period": f"過去{days}日間",
            "children_analysis": children_analysis
        }
        
    except Exception as e:
        logger.error(f"感情分析サマリー取得エラー: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="感情分析サマリーの取得に失敗しました")
