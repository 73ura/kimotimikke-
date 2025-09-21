from __future__ import annotations

import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError

from app import models

logger = logging.getLogger(__name__)

UTC = timezone.utc


def now_utc() -> datetime:
    return datetime.now(UTC)


# UIDでユーザーを1件取得
async def get_user_by_uid(db: AsyncSession, uid: str) -> Optional[models.User]:
    try:
        stmt = (
            select(models.User)
            .where(models.User.uid == uid)
            .options(selectinload(models.User.subscriptions))
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error("get_user_by_uid failed", exc_info=e)
        return None


# UIDでユーザーをUPSERT（なければ作成・あれば更新）
async def upsert_user_by_uid(
    db: AsyncSession,
    *,
    uid: str,
    email: Optional[str],
    email_verified: bool,
    nickname: Optional[str],
) -> Optional[models.User]:
    try:
        update_set: dict = {
            "last_login_at": func.now(),
            "login_count": models.User.login_count + 1,
            "email_verified": email_verified,
        }
        if email is not None:
            update_set["email"] = email
        if nickname is not None:
            update_set["nickname"] = nickname

        stmt = (
            insert(models.User)
            .values(
                uid=uid,
                email=email,
                email_verified=email_verified,
                nickname=nickname,
                last_login_at=func.now(),
                login_count=1,
            )
            .on_conflict_do_update(
                index_elements=[models.User.uid],
                set_=update_set,
            )
            .returning(models.User.id)
        )

        res = await db.execute(stmt)
        user_id = res.scalar_one()
        await db.commit()

        return await db.get(models.User, user_id)

    except SQLAlchemyError as e:
        await db.rollback()
        logger.error("upsert_user_by_uid failed", exc_info=e)
        return None


async def get_or_create_user(
    db: AsyncSession,
    uid: str,
    email: Optional[str],
    email_verified: bool,
    nickname: Optional[str],
) -> Optional[models.User]:
    return await upsert_user_by_uid(
        db,
        uid=uid,
        email=email,
        email_verified=email_verified,
        nickname=nickname,
    )


# ユーザーに紐づくSubscriptionレコードの作成/更新
async def upsert_subscription_customer_id(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    stripe_customer_id: str,
) -> Optional[models.Subscription]:
    try:
        # 現在時刻から7日後を計算
        trial_started_at = now_utc()
        trial_expires_at = trial_started_at.replace(tzinfo=UTC) + timedelta(days=7)

        stmt = (
            insert(models.Subscription)
            .values(
                user_id=user_id,
                stripe_customer_id=stripe_customer_id,
                subscription_status="trial",
                is_trial=True,
                trial_started_at=trial_started_at,
                trial_expires_at=trial_expires_at,
                is_paid=False,
            )
            .on_conflict_do_update(
                index_elements=[models.Subscription.user_id],
                set_={
                    "stripe_customer_id": stripe_customer_id,
                    "subscription_status": "trial",
                    "is_trial": True,
                    "trial_started_at": trial_started_at,
                    "trial_expires_at": trial_expires_at,
                    "is_paid": False,
                },
            )
            .returning(models.Subscription.id)
        )
        res = await db.execute(stmt)
        sub_id = res.scalar_one()
        await db.commit()
        return await db.get(models.Subscription, sub_id)

    except SQLAlchemyError as e:
        await db.rollback()
        logger.error("upsert_subscription_customer_id failed", exc_info=e)
        return None


# 上のUPSERTを使い、必要なら user をリフレッシュ
async def update_stripe_customer_id(
    db: AsyncSession, user: models.User, stripe_customer_id: str
) -> Optional[models.User]:
    sub = await upsert_subscription_customer_id(
        db, user_id=user.id, stripe_customer_id=stripe_customer_id
    )
    if sub is None:
        return None
    try:
        await db.refresh(user)
    except SQLAlchemyError as e:
        logger.warning("refresh user after subscription upsert failed", exc_info=e)
    return user


async def get_user_by_stripe_customer_id(
    db: AsyncSession, stripe_customer_id: str
) -> Optional[models.User]:
    """Stripe顧客IDからユーザーを取得"""
    try:
        stmt = (
            select(models.User)
            .join(models.Subscription)
            .where(models.Subscription.stripe_customer_id == stripe_customer_id)
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error("get_user_by_stripe_customer_id failed", exc_info=e)
        return None


async def update_subscription_status(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    subscription_status: Optional[str] = None,
    stripe_subscription_id: Optional[str] = None,
    is_trial: Optional[bool] = None,
    trial_started_at: Optional[datetime] = None,
    trial_expires_at: Optional[datetime] = None,
    is_paid: Optional[bool] = None,
) -> Optional[models.Subscription]:
    """サブスクリプション状態を更新"""
    try:
        # 既存のサブスクリプションレコードを取得
        stmt = select(models.Subscription).where(models.Subscription.user_id == user_id)
        result = await db.execute(stmt)
        subscription = result.scalar_one_or_none()

        if not subscription:
            # 新規作成
            subscription = models.Subscription(
                user_id=user_id,
                subscription_status=subscription_status,
                stripe_subscription_id=stripe_subscription_id,
                is_trial=is_trial,
                trial_started_at=trial_started_at,
                trial_expires_at=trial_expires_at,
                is_paid=is_paid,
            )
            db.add(subscription)
        else:
            # 既存レコードの更新
            if subscription_status is not None:
                subscription.subscription_status = subscription_status
            if stripe_subscription_id is not None:
                subscription.stripe_subscription_id = stripe_subscription_id
            if is_trial is not None:
                subscription.is_trial = is_trial
            if trial_started_at is not None:
                subscription.trial_started_at = trial_started_at
            if trial_expires_at is not None:
                subscription.trial_expires_at = trial_expires_at
            if is_paid is not None:
                subscription.is_paid = is_paid

            # trial_expires_atが設定されている場合、現在の日付に基づいてis_trialを自動更新
            if subscription.trial_expires_at:
                current_time = now_utc()
                is_trial_calculated = current_time < subscription.trial_expires_at

                # デバッグログ追加
                logger.info(f"=== update_subscription_status トライアル判定 ===")
                logger.info(f"current_time: {current_time}")
                logger.info(f"trial_expires_at: {subscription.trial_expires_at}")
                logger.info(f"calculated is_trial: {is_trial_calculated}")
                logger.info(f"========================")

                subscription.is_trial = is_trial_calculated

        await db.commit()
        await db.refresh(subscription)
        return subscription

    except SQLAlchemyError as e:
        await db.rollback()
        logger.error("update_subscription_status failed", exc_info=e)
        return None


async def get_subscription_by_user_id(
    db: AsyncSession, user_id: uuid.UUID
) -> Optional[models.Subscription]:
    """ユーザーIDからサブスクリプション情報を取得"""
    try:
        stmt = select(models.Subscription).where(models.Subscription.user_id == user_id)
        result = await db.execute(stmt)
        subscription = result.scalar_one_or_none()

        if subscription and subscription.trial_expires_at:
            # trial_expires_atが設定されている場合、現在の日付に基づいてis_trialを自動更新
            current_time = now_utc()
            is_trial_calculated = current_time < subscription.trial_expires_at

            # デバッグログ追加
            logger.info(f"=== トライアル判定デバッグ ===")
            logger.info(f"current_time: {current_time}")
            logger.info(f"trial_expires_at: {subscription.trial_expires_at}")
            logger.info(f"current < trial_expires: {is_trial_calculated}")
            logger.info(f"stored is_trial: {subscription.is_trial}")
            logger.info(f"needs update: {subscription.is_trial != is_trial_calculated}")
            logger.info(f"========================")

            if subscription.is_trial != is_trial_calculated:
                subscription.is_trial = is_trial_calculated
                await db.commit()
                await db.refresh(subscription)
                logger.info(f"Updated is_trial to: {subscription.is_trial}")

        return subscription
    except SQLAlchemyError as e:
        logger.error("get_subscription_by_user_id failed", exc_info=e)
        return None


# Childrenテーブルにデータを挿入
async def create_child(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    nickname: str,
    birth_date: str,  # YYYY-MM-DD形式
    gender: str,
) -> Optional[models.Child]:
    """子どものプロフィールを作成"""
    try:
        # 誕生日をDate型に変換
        birth_date_obj = datetime.strptime(birth_date, "%Y-%m-%d").date()

        child = models.Child(
            user_id=user_id,
            nickname=nickname,
            birth_date=birth_date_obj,
            gender=gender,
        )

        db.add(child)
        await db.commit()
        await db.refresh(child)
        return child

    except SQLAlchemyError as e:
        await db.rollback()
        logger.error("create_child failed", exc_info=e)
        return None
    except ValueError as e:
        logger.error("Invalid birth_date format", exc_info=e)
        return None


async def get_children_by_user_id(
    db: AsyncSession, user_id: uuid.UUID
) -> list[models.Child]:
    """ユーザーIDから子どものリストを取得"""
    try:
        stmt = select(models.Child).where(models.Child.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalars().all()
    except SQLAlchemyError as e:
        logger.error("get_children_by_user_id failed", exc_info=e)
        return []


async def get_child_by_id(
    db: AsyncSession, child_id: uuid.UUID
) -> Optional[models.Child]:
    """IDから子どものプロフィールを取得"""
    try:
        stmt = select(models.Child).where(models.Child.id == child_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error("get_child_by_id failed", exc_info=e)
        return None


async def update_child(
    db: AsyncSession,
    *,
    child_id: uuid.UUID,
    nickname: str,
    birth_date: str,  # YYYY-MM-DD形式
    gender: str,
) -> Optional[models.Child]:
    """子どものプロフィールを更新"""
    try:
        # 子供を取得
        child = await get_child_by_id(db, child_id)
        if not child:
            return None

        # 誕生日をDate型に変換
        birth_date_obj = datetime.strptime(birth_date, "%Y-%m-%d").date()

        # プロフィールを更新
        child.nickname = nickname
        child.birth_date = birth_date_obj
        child.gender = gender
        child.updated_at = now_utc()

        await db.commit()
        await db.refresh(child)
        return child

    except SQLAlchemyError as e:
        await db.rollback()
        logger.error("update_child failed", exc_info=e)
        return None
    except ValueError as e:
        logger.error("Invalid birth_date format", exc_info=e)
        return None


async def delete_child(
    db: AsyncSession,
    *,
    child_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """子どものプロフィールを削除"""
    try:
        # 子供を取得して権限チェック
        child = await get_child_by_id(db, child_id)
        if not child or child.user_id != user_id:
            return False

        # 子供を削除
        await db.delete(child)
        await db.commit()
        return True

    except SQLAlchemyError as e:
        await db.rollback()
        logger.error("delete_child failed", exc_info=e)
        return False
