#!/bin/bash

# Google Secret Manager にシークレットを設定するスクリプト
# 使用方法: ./setup-secrets.sh PROJECT_ID

PROJECT_ID=$1

if [ -z "$PROJECT_ID" ]; then
    echo "使用方法: $0 <PROJECT_ID>"
    exit 1
fi

echo "🔐 Google Secret Manager にシークレットを設定中..."

# Secret Manager APIを有効化
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# データベース関連シークレット
gcloud secrets create database-url --project=$PROJECT_ID || echo "database-url は既に存在します"
gcloud secrets create database-url-sync --project=$PROJECT_ID || echo "database-url-sync は既に存在します"

# Firebase関連シークレット
gcloud secrets create firebase-project-id --project=$PROJECT_ID || echo "firebase-project-id は既に存在します"
gcloud secrets create firebase-service-account --project=$PROJECT_ID || echo "firebase-service-account は既に存在します"

# OpenAI関連シークレット
gcloud secrets create openai-api-key --project=$PROJECT_ID || echo "openai-api-key は既に存在します"

# Stripe関連シークレット
gcloud secrets create stripe-secret-key --project=$PROJECT_ID || echo "stripe-secret-key は既に存在します"
gcloud secrets create stripe-publishable-key --project=$PROJECT_ID || echo "stripe-publishable-key は既に存在します"
gcloud secrets create stripe-webhook-secret --project=$PROJECT_ID || echo "stripe-webhook-secret は既に存在します"

# AWS関連シークレット
gcloud secrets create aws-access-key-id --project=$PROJECT_ID || echo "aws-access-key-id は既に存在します"
gcloud secrets create aws-secret-access-key --project=$PROJECT_ID || echo "aws-secret-access-key は既に存在します"
gcloud secrets create s3-bucket-name --project=$PROJECT_ID || echo "s3-bucket-name は既に存在します"

# アプリケーション関連シークレット
gcloud secrets create app-secret-key --project=$PROJECT_ID || echo "app-secret-key は既に存在します"

echo "✅ Secret Manager の設定が完了しました"
echo ""
echo "次のステップ："
echo "1. 各シークレットに実際の値を設定:"
echo "   gcloud secrets versions add database-url --data-file=- --project=$PROJECT_ID"
echo "2. Cloud Run サービスアカウントに適切な権限を付与:"
echo "   gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "     --member=\"serviceAccount:your-service-account@$PROJECT_ID.iam.gserviceaccount.com\" \\"
echo "     --role=\"roles/secretmanager.secretAccessor\""
