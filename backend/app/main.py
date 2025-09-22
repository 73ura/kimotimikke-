import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
import stripe


from app.api.v1.endpoints.voice import router as new_voice_router
from app.api.v1.endpoints.children import router as children_router
from app.api.v1.endpoints.auth import router as auth_router
from app.utils.error_handlers import register_error_handlers
from app.api.v1.endpoints.emotion_color_api import router as emotion_color_router
from app.api.v1.endpoints.emotion_api import router as emotion_router
from app.api.v1.endpoints.emotion_analysis_api import router as emotion_analysis_router
from app.api.v1.endpoints.keyword_matching_api import router as keyword_matching_router
from app.api.v1.endpoints.gemini_ai_api import router as gemini_ai_router
from app.api.v1.endpoints.stripe_api import router as stripe_router
from app.api.v1.endpoints.roleplay import router as roleplay_router

logging.basicConfig(level=logging.INFO, force=True)
logger = logging.getLogger(__name__)


load_dotenv()

#  Firebase Adminの初期化し秘密鍵を読み込む
# Firebase認証の初期化（テスト環境ではスキップ）
if os.getenv("SKIP_FIREBASE_AUTH", "false").lower() != "true":
    cred_path = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS", "/firebase-service-account.json"
    )
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

# Stripe APIキーの設定
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


# --- Lifespan Manager ---
@asynccontextmanager
async def lifespan(_: FastAPI):
    # データベース初期化は本番環境ではAlembicマイグレーションで実行
    # Whisperモデルの事前読み込み（高速化）
    try:
        from app.services.whisper import WhisperService

        whisper_service = WhisperService()
        await whisper_service.warm_up()
        logger.info("Whisperモデル事前読み込み完了")
    except (ImportError, ValueError, RuntimeError) as e:
        logger.error("Whisperモデル事前読み込み失敗: %s", e)
        # エラーが発生してもアプリは起動を継続

    yield


security_schemes = {"bearerAuth": {"type": "http", "scheme": "bearer"}}

# lifespanを登録して、起動時の処理を有効化
app = FastAPI(
    lifespan=lifespan, openapi_components={"securitySchemes": security_schemes}
)

# エラーハンドラの登録
register_error_handlers(app)

# CORSミドルウェア設定
origins = [
    "http://localhost:3000",  # 開発環境
    "https://localhost:3000",  # 開発環境（HTTPS）
    # 本番用ドメイン（環境変数から取得）
]

# 環境変数から本番ドメインを追加
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(auth_router, prefix="/api/v1")
app.include_router(new_voice_router, prefix="/api/v1")
app.include_router(children_router, prefix="/api/v1/children")
app.include_router(emotion_router)
app.include_router(emotion_color_router)
app.include_router(emotion_analysis_router, prefix="/api/v1")
app.include_router(keyword_matching_router, prefix="/api/v1/keyword-matching")
app.include_router(gemini_ai_router, prefix="/api/v1/gemini-ai")
app.include_router(stripe_router)
app.include_router(roleplay_router, prefix="/api/v1/roleplay")
