"""
キーワードマッチングAPIエンドポイント
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.services.keyword_matching import KeywordMatchingService
from app.schemas import KeywordMatchingResult
from app.api.v1.endpoints.auth import get_current_user
from app.models import User

router = APIRouter()


@router.get("/child/{child_id}", response_model=KeywordMatchingResult)
async def analyze_keyword_matches(
    child_id: str,
    days: int = Query(30, ge=1, le=365, description="分析期間（日数）"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    キーワードマッチング分析を実行
    
    - **child_id**: 分析対象の子供のID
    - **days**: 分析期間（1-365日）
    """
    try:
        keyword_service = KeywordMatchingService(db)
        result = await keyword_service.analyze_keyword_matches(
            child_id=child_id,
            user_id=current_user.id,
            days=days
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"キーワードマッチング分析に失敗しました: {str(e)}"
        )
