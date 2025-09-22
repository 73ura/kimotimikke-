"""
Gemini AI分析APIエンドポイント
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.services.gemini_ai import GeminiAIService
from app.schemas import GeminiAnalysisResult
from app.api.v1.endpoints.auth import get_current_user
from app.models import User

router = APIRouter()


@router.get("/child/{child_id}", response_model=GeminiAnalysisResult)
async def analyze_with_gemini(
    child_id: str,
    days: int = Query(30, ge=1, le=365, description="分析期間（日数）"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Gemini AIで音声テキスト分析を実行
    
    - **child_id**: 分析対象の子供のID
    - **days**: 分析期間（1-365日）
    """
    try:
        gemini_service = GeminiAIService(db)
        result = await gemini_service.analyze_voice_texts(
            child_id=child_id,
            user_id=current_user.id,
            days=days
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini AI分析に失敗しました: {str(e)}"
        )
