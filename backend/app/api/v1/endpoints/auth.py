import logging
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Security, Response, Request
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


async def get_current_user_from_cookie(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """HttpOnly Cookieからユーザー情報を取得（XSS攻撃対策）"""
    try:
        # HttpOnly CookieからID Tokenを取得
        id_token = request.cookies.get("firebase-id-token")
        if not id_token:
            raise HTTPException(status_code=401, detail="No authentication token")

        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]

        user = await crud.get_user_by_uid(db, uid)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user
    except Exception as e:
        logging.warning("Cookie authentication failed", exc_info=e)
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )


def verify_csrf_token(request: Request):
    """CSRFトークンの検証"""
    csrf_token = request.headers.get("X-CSRF-Token")
    cookie_csrf_token = request.cookies.get("csrf-token")
    
    if not csrf_token or not cookie_csrf_token:
        raise HTTPException(status_code=403, detail="CSRF token missing")
    
    if csrf_token != cookie_csrf_token:
        raise HTTPException(status_code=403, detail="CSRF token mismatch")
    
    return True


@router.post("/verify-token")
async def verify_token(token: HTTPAuthorizationCredentials = Security(security)):
    """トークン検証API - Middleware用の軽量な認証チェック"""
    try:
        decoded_token = auth.verify_id_token(token.credentials)
        return {"valid": True, "uid": decoded_token["uid"]}
    except Exception as e:
        logging.warning("Token verification failed", exc_info=e)
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login", response_model=schemas.UserResponse)
async def login(
    token: schemas.Token, 
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """ログインAPI - Firebase ID Tokenでユーザー認証 + HttpOnly Cookie設定"""
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

    # CSRFトークンを生成
    csrf_token = secrets.token_urlsafe(32)
    
    # HttpOnly Cookieを設定（XSS攻撃対策）
    response.set_cookie(
        key="firebase-id-token",
        value=token.id_token,
        max_age=3600,  # 1時間
        httponly=True,  # XSS攻撃対策
        secure=True,    # HTTPS必須
        samesite="strict",  # CSRF攻撃対策
        path="/"
    )
    
    # CSRFトークンをCookieに設定
    response.set_cookie(
        key="csrf-token",
        value=csrf_token,
        max_age=3600,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/"
    )

    return user


@router.post("/logout")
async def logout(response: Response):
    """ログアウトAPI - HttpOnly Cookieを削除"""
    # HttpOnly Cookieを削除
    response.delete_cookie(
        key="firebase-id-token",
        path="/",
        httponly=True,
        secure=True,
        samesite="strict"
    )
    
    response.delete_cookie(
        key="csrf-token",
        path="/",
        httponly=True,
        secure=True,
        samesite="strict"
    )
    
    return {"message": "Logged out successfully"}
