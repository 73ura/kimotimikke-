#!/bin/bash

# 環境変数設定スクリプト
# 使用方法: ./configure-secrets.sh

echo "🔐 環境変数の設定を開始します..."

# OpenAI API Key
echo ""
echo "1. OpenAI API Key の設定"
echo "   https://platform.openai.com/api-keys でAPI Keyを取得してください"
read -p "OpenAI API Key を入力してください: " openai_key
if [ ! -z "$openai_key" ]; then
    echo "$openai_key" | gcloud secrets versions add openai-api-key --data-file=-
    echo "✅ OpenAI API Key を設定しました"
fi

# Stripe設定
echo ""
echo "2. Stripe設定"
echo "   https://dashboard.stripe.com/apikeys でAPI Keyを取得してください"
read -p "Stripe Secret Key (sk_test_...) を入力してください: " stripe_secret
if [ ! -z "$stripe_secret" ]; then
    echo "$stripe_secret" | gcloud secrets versions add stripe-secret-key --data-file=-
    echo "✅ Stripe Secret Key を設定しました"
fi

read -p "Stripe Publishable Key (pk_test_...) を入力してください: " stripe_public
if [ ! -z "$stripe_public" ]; then
    echo "$stripe_public" | gcloud secrets versions add stripe-publishable-key --data-file=-
    echo "✅ Stripe Publishable Key を設定しました"
fi

read -p "Stripe Webhook Secret (whsec_...) を入力してください（後で設定可能）: " stripe_webhook
if [ ! -z "$stripe_webhook" ]; then
    echo "$stripe_webhook" | gcloud secrets versions add stripe-webhook-secret --data-file=-
    echo "✅ Stripe Webhook Secret を設定しました"
else
    echo "dummy-webhook-secret" | gcloud secrets versions add stripe-webhook-secret --data-file=-
    echo "⚠️ ダミーのWebhook Secretを設定しました（後で更新してください）"
fi

# AWS設定
echo ""
echo "3. AWS S3設定"
echo "   AWS Console でアクセスキーとS3バケットを作成してください"
read -p "AWS Access Key ID を入力してください: " aws_key_id
if [ ! -z "$aws_key_id" ]; then
    echo "$aws_key_id" | gcloud secrets versions add aws-access-key-id --data-file=-
    echo "✅ AWS Access Key ID を設定しました"
fi

read -p "AWS Secret Access Key を入力してください: " aws_secret
if [ ! -z "$aws_secret" ]; then
    echo "$aws_secret" | gcloud secrets versions add aws-secret-access-key --data-file=-
    echo "✅ AWS Secret Access Key を設定しました"
fi

read -p "S3 Bucket Name を入力してください: " s3_bucket
if [ ! -z "$s3_bucket" ]; then
    echo "$s3_bucket" | gcloud secrets versions add s3-bucket-name --data-file=-
    echo "✅ S3 Bucket Name を設定しました"
fi

# Firebase設定
echo ""
echo "4. Firebase設定"
read -p "Firebase Project ID を入力してください: " firebase_project
if [ ! -z "$firebase_project" ]; then
    echo "$firebase_project" | gcloud secrets versions add firebase-project-id --data-file=-
    echo "✅ Firebase Project ID を設定しました"
fi

read -p "Firebase Service Account JSON ファイルのパスを入力してください: " firebase_json
if [ -f "$firebase_json" ]; then
    gcloud secrets versions add firebase-service-account --data-file="$firebase_json"
    echo "✅ Firebase Service Account を設定しました"
else
    echo "{\"type\":\"service_account\",\"project_id\":\"dummy\"}" | gcloud secrets versions add firebase-service-account --data-file=-
    echo "⚠️ ダミーのFirebase Service Accountを設定しました（後で更新してください）"
fi

# アプリケーションシークレット
echo ""
echo "5. アプリケーションシークレット"
app_secret="kimotimikke-secret-$(openssl rand -hex 32)"
echo "$app_secret" | gcloud secrets versions add app-secret-key --data-file=-
echo "✅ アプリケーションシークレットを生成・設定しました"

echo ""
echo "🎉 環境変数の設定が完了しました！"
echo ""
echo "設定された環境変数:"
gcloud secrets list --format="table(name,createTime)"
