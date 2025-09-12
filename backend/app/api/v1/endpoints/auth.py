import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from firebase_admin import auth

from app import crud, schemas
from app.config.database import get_db
from app.models import User

router = APIRouter(tags=["auth"])

# HTTPBearer認証スキーム
security = HTTPBearer()


async def get_current_user(
    token: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """認証トークンからユーザー情報を取得"""
    try:
        decoded_token = auth.verify_id_token(token.credentials)
        uid = decoded_token["uid"]

        user = await crud.get_user_by_uid(db, uid)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user
    except Exception as e:
        logging.warning("Authentication failed", exc_info=e)
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )


@router.post("/login", response_model=schemas.UserResponse)
async def login(token: schemas.Token, db: AsyncSession = Depends(get_db)):
    """ログインAPI - Firebase ID Tokenでユーザー認証"""
    try:
        decoded_token = auth.verify_id_token(token.id_token)
    except Exception as e:
        logging.warning("Login token invalid", exc_info=e)
        raise HTTPException(status_code=401, detail="Invalid token")

    uid = decoded_token["uid"]
    email = decoded_token.get("email")
    email_verified = decoded_token.get("email_verified", False)
    nickname = decoded_token.get("name")

    user = await crud.get_or_create_user(
        db, uid=uid, email=email, email_verified=email_verified, nickname=nickname
    )
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create user")

    return user
