import os
import stripe
import logging
from fastapi import APIRouter, Depends, HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from firebase_admin import auth
from datetime import datetime, timezone, timedelta
import uuid

from app import crud, schemas
from app.models import User
from app.config.database import get_db

# Stripe関連のAPIルーター設定
router = APIRouter(
    prefix="/api/v1/stripe",
    tags=["stripe"],
)


# HTTPヘッダーのBearerトークンからFirebaseのUIDを取得
async def get_uid(
    cred: HTTPAuthorizationCredentials = Security(HTTPBearer()),
) -> str:
    token = cred.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        logging.error(f"Token verification failed", exc_info=e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# UIDからDBのユーザー情報を取得
async def get_current_user(
    uid: str = Depends(get_uid),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await crud.get_user_by_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found in database")
    return user


# Stripe Checkoutセッション作成
@router.post(
    "/checkout-session",
    summary="Stripe CheckoutセッションURLを取得",
    description="""
    フロントエンドでStripeの決済画面に遷移するためのCheckout Sessionを作成する。
    - 初回利用時はStripe顧客（Customer）を作成してDBに保存
    - 7日間のトライアル付き定期課金を設定
    """,
    response_model=schemas.CheckoutSessionResponse,
)
async def create_checkout_session(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    price_id = os.getenv("STRIPE_PRICE_ID")
    # 本番環境では、localhost:3000を実際のドメインに変更する必要あり
    success_url = (
        "http://localhost:3000/app/payment/onboarding?session_id={CHECKOUT_SESSION_ID}"
    )
    cancel_url = "http://localhost:3000/pricing"

    # DBからStripe顧客IDを取得
    stripe_customer_id = (
        current_user.subscriptions.stripe_customer_id
        if current_user.subscriptions
        else None
    )

    # まだStripeの顧客でない場合は、新しく作成する
    if not stripe_customer_id:
        # まずStripe顧客を作成
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.nickname,
        )
        stripe_customer_id = customer.id

        # サブスクリプションレコードが存在しない場合は作成
        if not current_user.subscriptions:
            await crud.upsert_subscription_customer_id(
                db,
                user_id=current_user.id,
                stripe_customer_id=stripe_customer_id,  # 実際のStripe顧客ID
            )
        else:
            # 既存のレコードに顧客IDを更新
            await crud.update_stripe_customer_id(
                db, user=current_user, stripe_customer_id=stripe_customer_id
            )

    try:
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            subscription_data={"trial_period_days": 7},
            success_url=success_url,
            cancel_url=cancel_url,
        )
        # フロントエンドが利用するセッションIDを返す
        return {"sessionId": checkout_session.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Stripeセッションの状態を取得
@router.post("/session-status")
async def get_session_status(
    request: schemas.SessionStatusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
        session = stripe.checkout.Session.retrieve(request.session_id)
        payment_status = session.payment_status
        customer_id = session.customer
        subscription_id = session.subscription
        response_data = {
            "session_id": request.session_id,
            "payment_status": payment_status,
            "customer_id": customer_id,
            "subscription_id": subscription_id,
            "success": True,
        }
        if payment_status == "paid":
            response_data["message"] = "Payment completed successfully"
        else:
            response_data["message"] = f"Payment status: {payment_status}"
        return response_data
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}") from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}"
        ) from e


# Webhookエンドポイント
@router.post(
    "/webhook",
    summary="Stripe Webhook受信",
    description="Stripeからの決済状態変更通知を受信し、DBを更新します。",
)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    # リクエストボディを取得
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        # Webhook署名の検証
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # イベントタイプに応じた処理
    try:
        await handle_stripe_event(event, db)
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook processing failed: {str(e)}", exc_info=e)
        raise HTTPException(status_code=500, detail="Webhook processing failed")


async def handle_stripe_event(event: dict, db: AsyncSession):
    """Stripeイベントの種類に応じて適切な処理を実行"""
    event_type = event["type"]

    if event_type == "checkout.session.completed":
        await handle_checkout_completed(event, db)
    elif event_type == "customer.subscription.created":
        await handle_subscription_created(event, db)
    elif event_type == "customer.subscription.updated":
        await handle_subscription_updated(event, db)
    elif event_type == "customer.subscription.deleted":
        await handle_subscription_deleted(event, db)
    elif event_type == "invoice.payment_succeeded":
        await handle_payment_succeeded(event, db)
    elif event_type == "invoice.payment_failed":
        await handle_payment_failed(event, db)
    else:
        logging.info(f"Unhandled event type: {event_type}")


async def handle_checkout_completed(event: dict, db: AsyncSession):
    """チェックアウト完了時の処理"""
    session = event["data"]["object"]
    customer_id = session["customer"]
    subscription_id = session["subscription"]

    # 顧客IDからユーザーを検索
    user = await crud.get_user_by_stripe_customer_id(db, customer_id)
    if not user:
        logging.error(f"User not found for customer_id: {customer_id}")
        return

    # サブスクリプション情報を更新
    await crud.update_subscription_status(
        db,
        user_id=user.id,
        stripe_subscription_id=subscription_id,
        subscription_status="active",
        is_trial=True,
        trial_started_at=datetime.now(timezone.utc),
    )


async def handle_subscription_updated(event: dict, db: AsyncSession):
    """サブスクリプション更新時の処理"""
    subscription = event["data"]["object"]
    customer_id = subscription["customer"]
    status = subscription["status"]
    trial_end = subscription.get("trial_end")

    user = await crud.get_user_by_stripe_customer_id(db, customer_id)
    if not user:
        return

    # トライアル終了日の設定
    trial_expires_at = None
    if trial_end:
        trial_expires_at = datetime.fromtimestamp(trial_end, tz=timezone.utc)

    await crud.update_subscription_status(
        db,
        user_id=user.id,
        subscription_status=status,
        trial_expires_at=trial_expires_at,
        is_trial=status == "trialing",
    )


async def handle_subscription_deleted(event: dict, db: AsyncSession):
    """サブスクリプション削除時の処理"""
    subscription = event["data"]["object"]
    customer_id = subscription["customer"]

    user = await crud.get_user_by_stripe_customer_id(db, customer_id)
    if not user:
        return

    await crud.update_subscription_status(
        db,
        user_id=user.id,
        subscription_status="canceled",
        is_trial=False,
        is_paid=False,
    )


async def handle_payment_succeeded(event: dict, db: AsyncSession):
    """支払い成功時の処理"""
    invoice = event["data"]["object"]
    customer_id = invoice["customer"]

    user = await crud.get_user_by_stripe_customer_id(db, customer_id)
    if not user:
        return

    await crud.update_subscription_status(
        db, user_id=user.id, is_paid=True, is_trial=False
    )


async def handle_payment_failed(event: dict, db: AsyncSession):
    """支払い失敗時の処理"""
    invoice = event["data"]["object"]
    customer_id = invoice["customer"]

    user = await crud.get_user_by_stripe_customer_id(db, customer_id)
    if not user:
        return

    await crud.update_subscription_status(db, user_id=user.id, is_paid=False)


async def handle_subscription_created(event: dict, db: AsyncSession):
    """サブスクリプション作成時の処理"""
    subscription = event["data"]["object"]
    customer_id = subscription["customer"]
    subscription_id = subscription["id"]

    # 顧客IDからユーザーを検索
    user = await crud.get_user_by_stripe_customer_id(db, customer_id)
    if not user:
        logging.error(f"User not found for customer_id: {customer_id}")
        return

    # サブスクリプション情報を更新
    await crud.update_subscription_status(
        db,
        user_id=user.id,
        stripe_subscription_id=subscription_id,
        subscription_status="active",
        is_trial=True,
        trial_started_at=datetime.now(timezone.utc),
        trial_expires_at=datetime.now(timezone.utc).replace(tzinfo=timezone.utc)
        + timedelta(days=7),
    )


# サブスクリプション状態取得エンドポイント
@router.get(
    "/subscription/status",
    summary="サブスクリプション状態取得",
    description="現在のユーザーのサブスクリプション状態を取得します。",
)
async def get_subscription_status(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    try:
        # ユーザーのサブスクリプション情報を取得
        subscription = await crud.get_subscription_by_user_id(db, current_user.id)

        if not subscription:
            return {
                "has_subscription": False,
                "status": "none",
                "is_trial": False,
                "is_paid": False,
                "trial_expires_at": None,
            }

        # トライアル期間の計算
        trial_expires_at = None
        if subscription.trial_expires_at:
            trial_expires_at = subscription.trial_expires_at.isoformat()

        # Stripeからキャンセル状態を取得
        cancel_at_period_end = False
        if subscription.stripe_subscription_id:
            try:
                stripe_subscription = stripe.Subscription.retrieve(
                    subscription.stripe_subscription_id
                )
                cancel_at_period_end = stripe_subscription.cancel_at_period_end
            except Exception as e:
                logging.error(f"Failed to retrieve Stripe subscription: {e}")

        return {
            "has_subscription": True,
            "status": subscription.subscription_status or "unknown",
            "is_trial": subscription.is_trial,
            "is_paid": subscription.is_paid,
            "trial_expires_at": trial_expires_at,
            "stripe_subscription_id": getattr(
                subscription, "stripe_subscription_id", None
            ),
            "cancel_at_period_end": cancel_at_period_end,
        }

    except Exception as e:
        logging.error(f"Subscription status fetch failed: {str(e)}", exc_info=e)
        raise HTTPException(
            status_code=500, detail="Failed to fetch subscription status"
        )


# サブスクリプション解約エンドポイント
@router.post(
    "/subscription/cancel",
    summary="サブスクリプション解約",
    description="現在のユーザーのサブスクリプションを解約します。",
)
async def cancel_subscription(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    try:
        logging.info(f"Cancel subscription request for user: {current_user.id}")

        # ユーザーのサブスクリプション情報を取得
        subscription = await crud.get_subscription_by_user_id(db, current_user.id)

        if not subscription or not subscription.stripe_subscription_id:
            logging.error(f"No subscription found for user {current_user.id}")
            raise HTTPException(
                status_code=404, detail="アクティブなサブスクリプションが見つかりません"
            )

        logging.info(f"Found subscription: {subscription.stripe_subscription_id}")

        # Stripeでサブスクリプションを解約
        try:
            logging.info(
                f"Calling Stripe API to cancel subscription: {subscription.stripe_subscription_id}"
            )
            stripe_subscription = stripe.Subscription.modify(
                subscription.stripe_subscription_id, cancel_at_period_end=True
            )

            logging.info(
                f"Subscription canceled: {subscription.stripe_subscription_id}"
            )

            # データベースの状態を更新
            await crud.update_subscription_status(
                db, user_id=current_user.id, subscription_status="canceled"
            )

            return {
                "success": True,
                "message": "サブスクリプションの解約手続きが完了しました",
                "cancel_at_period_end": stripe_subscription.cancel_at_period_end,
                "current_period_end": getattr(
                    stripe_subscription, "current_period_end", None
                ),
            }

        except stripe.error.StripeError as stripe_err:
            logging.error(f"Stripe subscription cancellation failed: {str(stripe_err)}")
            logging.error(f"Stripe error type: {type(stripe_err).__name__}")
            logging.error(
                f"Stripe error code: {getattr(stripe_err, 'code', 'Unknown')}"
            )
            raise HTTPException(
                status_code=400,
                detail=f"サブスクリプションの解約に失敗しました: {str(stripe_err)}",
            )

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Subscription cancellation failed: {str(e)}", exc_info=e)
        raise HTTPException(
            status_code=500,
            detail="サブスクリプションの解約処理中にエラーが発生しました",
        )
