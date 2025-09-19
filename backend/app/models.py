import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    Text,
    ForeignKey,
    func,
    Date,
    text,
    CheckConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    uid: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False)
    nickname: Mapped[str] = mapped_column(String, nullable=True)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # TODO: 管理者画面を作成したら以下にnullable=Falseを入れること
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    login_count: Mapped[int] = mapped_column(Integer, default=0)
    role: Mapped[str] = mapped_column(String, default="user")

    # Relationships
    subscriptions = relationship("Subscription", back_populates="user", uselist=False)
    children = relationship("Child", back_populates="user")
    emotion_logs = relationship("EmotionLog", back_populates="user")
    daily_reports = relationship("DailyReport", back_populates="user")
    weekly_reports = relationship("WeeklyReport", back_populates="user")
    report_notifications = relationship("ReportNotification", back_populates="user")
    roleplay_sessions = relationship("RoleplaySession")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    stripe_customer_id: Mapped[str] = mapped_column(String, nullable=True, unique=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String, nullable=True)
    subscription_status: Mapped[str] = mapped_column(String, nullable=True)
    is_trial: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    trial_started_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    trial_expires_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationship
    user = relationship("User", back_populates="subscriptions")


class Child(Base):
    __tablename__ = "children"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    nickname: Mapped[str] = mapped_column(String, nullable=False)
    birth_date: Mapped[Date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="children")
    emotion_logs = relationship("EmotionLog", back_populates="child")
    daily_reports = relationship("DailyReport", back_populates="child")
    weekly_reports = relationship("WeeklyReport", back_populates="child")
    report_notifications = relationship("ReportNotification", back_populates="child")
    roleplay_sessions = relationship("RoleplaySession")


class EmotionCard(Base):
    __tablename__ = "emotion_cards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    label: Mapped[str] = mapped_column(String, nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    emotion_logs = relationship("EmotionLog", back_populates="emotion_card")


class Intensity(Base):
    __tablename__ = "intensity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    color_modifier: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    emotion_logs = relationship("EmotionLog", back_populates="intensity")


class EmotionLog(Base):
    __tablename__ = "emotion_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("children.id"), nullable=False, index=True
    )
    emotion_card_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("emotion_cards.id"), nullable=False
    )
    intensity_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("intensity.id"), nullable=False
    )
    voice_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    text_file_path: Mapped[str | None] = mapped_column(
        String, nullable=True
    )  # テキストファイルのS3パス
    audio_file_path: Mapped[str] = mapped_column(String)  # 音声ファイルのS3パス

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="emotion_logs")
    child = relationship("Child", back_populates="emotion_logs")
    emotion_card = relationship("EmotionCard", back_populates="emotion_logs")
    intensity = relationship("Intensity", back_populates="emotion_logs")
    daily_report = relationship(
        "DailyReport", back_populates="emotion_log", uselist=False
    )
    roleplay_sessions = relationship("RoleplaySession")


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("children.id"), nullable=False, index=True
    )
    emotion_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("emotion_logs.id"), nullable=False, unique=True
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="daily_reports")
    child = relationship("Child", back_populates="daily_reports")
    emotion_log = relationship(
        "EmotionLog", back_populates="daily_report", uselist=False
    )


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("children.id"), nullable=False, index=True
    )
    week_start_date: Mapped[Date] = mapped_column(Date, nullable=False)
    week_end_date: Mapped[Date] = mapped_column(Date, nullable=False)
    trend_summary: Mapped[str] = mapped_column(Text, nullable=False)
    advice_for_child: Mapped[str] = mapped_column(Text, nullable=False)
    growth_points: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="weekly_reports")
    child = relationship("Child", back_populates="weekly_reports")


class ReportNotification(Base):
    __tablename__ = "report_notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("children.id"), nullable=False, index=True
    )
    notification_day: Mapped[str] = mapped_column(String)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="report_notifications")
    child = relationship("Child", back_populates="report_notifications")


class RoleplayScenario(Base):
    __tablename__ = "roleplay_scenarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(7), nullable=False)  # HEXカラーコード
    scenario_content: Mapped[str] = mapped_column(Text, nullable=False)  # ロールプレイの詳細内容
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # シナリオ画像パス
    emotion_types: Mapped[list[str]] = mapped_column(ARRAY(String(32)), nullable=False)  # 対象感情の配列
    keywords: Mapped[list[str]] = mapped_column(ARRAY(String(64)), nullable=False)  # マッチング用キーワード
    age_range_min: Mapped[int] = mapped_column(Integer, default=3, server_default=text('3'), nullable=False)
    age_range_max: Mapped[int] = mapped_column(Integer, default=8, server_default=text('8'), nullable=False)
    difficulty_level: Mapped[int] = mapped_column(Integer, default=1, server_default=text('1'), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text('true'), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default=text('0'), nullable=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Constraints
    __table_args__ = (
        CheckConstraint('age_range_min >= 1', name='check_age_range_min'),
        CheckConstraint('age_range_max <= 12', name='check_age_range_max'),
        CheckConstraint('age_range_min <= age_range_max', name='check_age_range_order'),
        CheckConstraint('difficulty_level BETWEEN 1 AND 5', name='check_difficulty_level'),
        CheckConstraint("color ~ '^#[0-9A-Fa-f]{6}$'", name='check_color_hex'),
        CheckConstraint('cardinality(emotion_types) > 0', name='check_emotion_types_nonempty'),
        CheckConstraint('cardinality(keywords) > 0', name='check_keywords_nonempty'),
        # Indexes for performance
        Index('ix_roleplay_scenarios_is_active', 'is_active'),
    )

    # Relationships
    advice = relationship("RoleplayAdvice", back_populates="scenario", cascade="all, delete-orphan")
    sessions = relationship("RoleplaySession", back_populates="scenario")


class RoleplayAdvice(Base):
    __tablename__ = "roleplay_advice"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roleplay_scenarios.id", ondelete="CASCADE"),
        nullable=False,
    )
    emotion_id: Mapped[str] = mapped_column(String(50), nullable=False)  # 感情ID（emotion_cards.idと連携）
    advice_text: Mapped[str] = mapped_column(Text, nullable=False)
    advice_type: Mapped[str] = mapped_column(String(50), default="general", server_default=text("'general'"), nullable=False)  # 'general', 'breathing', 'communication'
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Constraints
    __table_args__ = (
        CheckConstraint('advice_type IN (\'general\', \'breathing\', \'communication\')', name='check_advice_type'),
    )

    # Relationships
    scenario = relationship("RoleplayScenario", back_populates="advice")


class RoleplaySession(Base):
    __tablename__ = "roleplay_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
    )
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roleplay_scenarios.id", ondelete="RESTRICT"),
        nullable=False,
    )
    emotion_log_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("emotion_logs.id"), nullable=True
    )  # きっかけとなった感情記録
    selected_emotion_id: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 選択された感情
    session_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # セッション時間（秒）
    completion_status: Mapped[str] = mapped_column(String(20), default="started", server_default=text("'started'"), nullable=False)  # 'started', 'completed', 'abandoned'
    user_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Constraints
    __table_args__ = (
        CheckConstraint('completion_status IN (\'started\', \'completed\', \'abandoned\')', name='check_completion_status'),
        CheckConstraint('user_rating BETWEEN 1 AND 5', name='check_user_rating'),
        CheckConstraint(
            "(completion_status <> 'completed') OR (completed_at IS NOT NULL)",
            name='check_completed_has_timestamp'
        ),
        CheckConstraint('session_duration IS NULL OR session_duration >= 0', name='check_duration_nonnegative'),
        # Indexes for performance
        Index('ix_roleplay_sessions_user', 'user_id'),
        Index('ix_roleplay_sessions_child', 'child_id'),
    )

    # Relationships
    user = relationship("User")
    child = relationship("Child")
    scenario = relationship("RoleplayScenario", back_populates="sessions")
    emotion_log = relationship("EmotionLog")
