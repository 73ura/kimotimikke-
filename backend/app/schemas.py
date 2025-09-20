from __future__ import annotations

from datetime import datetime, timezone, date
from typing import Optional, Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    AnyUrl,
    HttpUrl,
    ConfigDict,
    field_validator,
)


# -------------------
# 認証・ユーザー用スキーマ
# -------------------
class Token(BaseModel):
    id_token: str


class UserBase(BaseModel):
    email: EmailStr
    nickname: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    uid: str
    email_verified: bool
    role: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# -------------------
# 子供用スキーマ
# -------------------
class ChildBase(BaseModel):
    nickname: str
    birth_date: str  # YYYY-MM-DD形式
    gender: Literal["おとこのこ", "おんなのこ", "こたえない"]


class ChildResponse(ChildBase):
    id: UUID
    user_id: UUID
    birth_date: date  # データベースから返されるDate型
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------
# 感情ログ系スキーマ
# -------------------
class EmotionCardResponse(BaseModel):
    id: UUID
    label: str
    image_url: str
    color: str

    model_config = ConfigDict(from_attributes=True)


class IntensityResponse(BaseModel):
    id: int
    color_modifier: int

    model_config = ConfigDict(from_attributes=True)


class EmotionLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    child_id: UUID
    emotion_card_id: UUID
    intensity_id: int
    voice_note: Optional[str] = None
    text_file_path: Optional[str] = None
    audio_file_path: Optional[str] = None  # オプショナルに変更
    created_at: datetime
    updated_at: datetime

    # リレーションシップデータ
    emotion_card: Optional[EmotionCardResponse] = None
    intensity: Optional[IntensityResponse] = None

    model_config = ConfigDict(from_attributes=True)


class CheckoutSessionResponse(BaseModel):
    sessionId: str


# -------------------
# 音声用スキーマ
# -------------------

# 現状エンドポイントは音声のみをpresignする想定
AllowedFileType = Literal["audio"]
AllowedFileFormat = Literal["webm", "wav", "mp3", "m4a"]


class StrictModel(BaseModel):
    """余計なフィールドを拒否（タイプミスを早期検知）"""

    model_config = ConfigDict(extra="forbid")


# ===== Request =====
class VoiceUploadRequest(StrictModel):
    user_id: UUID = Field(
        ..., description="ユーザーID（UUID）", example="user-uuid-example"
    )
    file_type: AllowedFileType = Field(
        ..., description="ファイルタイプ", example="audio"
    )
    file_format: AllowedFileFormat = Field(
        default="webm", description="ファイル形式（webm/wav/mp3/m4a）", example="webm"
    )


class VoiceSaveRequest(StrictModel):
    user_id: UUID = Field(
        ..., description="ユーザーID（UUID）", example="user-uuid-example"
    )
    # S3キーを受ける（https は未対応）
    audio_file_path: str = Field(
        ...,
        description="音声ファイルのS3キー（例: audio/<uuid>/audio_YYYYMMDD_HHMMSS_xxx.webm）",
        example="audio/user-uuid-example/audio_YYYYMMDD_HHMMSS_xxx.webm",
    )
    text_file_path: Optional[str] = Field(
        None,
        description="テキストファイルのS3キー（任意）",
        example="text/user-uuid-example/transcription_audio_YYYYMMDD_HHMMSS_xxx.txt",
    )
    voice_note: Optional[str] = Field(
        None, description="音声認識テキスト（任意）", example="今日は楽しかった"
    )
    # 感情データのフィールドを追加
    emotion_card_id: str = Field(..., description="感情カードID（必須）", example="1")
    intensity_id: str = Field(..., description="感情強度ID（必須）", example="2")
    child_id: str = Field(
        ..., description="子供ID（必須）", example="child-uuid-example"
    )

    @field_validator("audio_file_path")
    @classmethod
    def validate_audio_key(cls, v: str) -> str:
        if v.startswith(("http://", "https://")):
            raise ValueError(
                "HTTP(S)のURLは未対応です。S3キー（例: 'audio/...') を渡してください。"
            )
        if "://" not in v:
            return v
        raise ValueError(
            "サポートされないパス形式です。S3キー（例: 'audio/...') を渡してください。"
        )

    @field_validator("text_file_path")
    @classmethod
    def validate_text_key(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v.startswith(("http://", "https://")):
            raise ValueError(
                "HTTP(S)のURLは未対応です。S3キー（例: 'text/...') を渡してください。"
            )
        if "://" not in v:
            return v
        raise ValueError(
            "サポートされないパス形式です。S3キー（例: 'text/...') を渡してください。"
        )


class VoiceTranscribeRequest(StrictModel):
    user_id: UUID = Field(
        ..., description="ユーザーID（UUID）", example="user-uuid-example"
    )
    audio_file_path: str = Field(
        ...,
        description="音声ファイルのS3キー（例: audio/<uuid>/xxx.webm）",
        example="audio/user-uuid-example/audio_YYYYMMDD_HHMMSS_xxx.webm",
    )
    # Whisper に 'auto' を渡す運用は外し、ja/en に限定
    language: Literal["ja", "en"] = Field(
        default="ja", description="言語コード (ja: 日本語, en: 英語)"
    )

    @field_validator("audio_file_path")
    @classmethod
    def validate_audio_file_path(cls, v: str) -> str:
        if v.startswith(("http://", "https://")):
            raise ValueError(
                "HTTP(S)の音声URLは未対応です。S3キー（例: 'audio/...') を渡してください。"
            )
        if "://" not in v:
            return v
        raise ValueError(
            "サポートされないパス形式です。S3キー（例: 'audio/...') を渡してください。"
        )


# ===== Response =====
class VoiceUploadResponse(StrictModel):
    success: bool = Field(..., description="処理成功フラグ", example=True)
    upload_url: HttpUrl = Field(..., description="アップロード用URL（署名付きHTTPS）")
    file_path: str = Field(
        ...,
        description="保存用の S3 キー（例: audio/<uuid>/audio_YYYYMMDD_HHMMSS_xxx.webm）",
        example="audio/user-uuid-example/audio_YYYYMMDD_HHMMSS_xxx.webm",
    )
    s3_url: AnyUrl = Field(..., description="S3上のファイルURL（https://）")
    content_type: str = Field(
        ...,
        description="ファイルのContent-Type（例: audio/webm）",
        example="audio/webm",
    )

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        # いまは音声のみプリサインPUTする運用なので audio/* のみ許可
        if "/" not in v:
            raise ValueError(
                "content_type は 'type/subtype' 形式（例: audio/webm）で指定してください"
            )
        if not v.startswith("audio/"):
            raise ValueError(
                "audio 系のMIMEタイプのみ許可（例: audio/webm, audio/wav）"
            )
        return v


class VoiceSaveResponse(StrictModel):
    success: bool = Field(..., description="処理成功フラグ", example=True)
    record_id: UUID = Field(..., description="保存されたレコードID（UUID）")
    message: str = Field(
        ..., description="処理結果メッセージ", example="Record saved successfully"
    )
    saved_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="保存時刻（UTC, timezone-aware）",
    )


class VoiceTranscribeResponse(StrictModel):
    success: bool = Field(..., description="処理成功フラグ", example=True)
    transcription_id: int = Field(
        ..., description="音声認識ID（未使用なら 0 でも可）", example=0
    )
    text: str = Field(..., description="認識されたテキスト")
    # 修正: Whisperのlogprob値（負の値）も受け付け
    confidence: float = Field(
        ..., ge=-10.0, le=10.0, description="認識精度（logprob値、-10.0〜10.0）"
    )
    language: str = Field(..., description="認識された言語", example="ja")
    duration: float = Field(..., ge=0.0, description="音声の長さ（秒）")
    processed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="処理完了時刻（UTC, timezone-aware）",
    )


class SessionStatusRequest(BaseModel):
    session_id: str


# -------------------
# ロールプレイ用スキーマ
# -------------------
class RoleplayScenarioResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    color: str
    scenario_content: str
    image_url: Optional[str] = None
    emotion_types: list[str]
    keywords: list[str]
    age_range_min: int
    age_range_max: int
    difficulty_level: int
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RoleplayAdviceResponse(BaseModel):
    id: UUID
    scenario_id: UUID
    emotion_id: str
    advice_text: str
    advice_type: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RoleplaySessionRequest(BaseModel):
    child_id: UUID
    scenario_id: UUID
    emotion_log_id: Optional[UUID] = None
    selected_emotion_id: Optional[str] = None


class RoleplaySessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    child_id: UUID
    scenario_id: UUID
    emotion_log_id: Optional[UUID] = None
    selected_emotion_id: Optional[str] = None
    session_duration: Optional[int] = None
    completion_status: str
    user_rating: Optional[int] = None
    user_feedback: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RoleplaySessionUpdateRequest(BaseModel):
    selected_emotion_id: Optional[str] = None
    session_duration: Optional[int] = None
    completion_status: Optional[Literal["started", "completed", "abandoned"]] = None
    user_rating: Optional[int] = Field(None, ge=1, le=5)
    user_feedback: Optional[str] = None
