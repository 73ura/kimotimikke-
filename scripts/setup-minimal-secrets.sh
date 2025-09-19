#!/bin/bash

# 最小限のデプロイテスト用環境変数設定
echo "🔐 デプロイテスト用の最小設定を開始..."

# OpenAI（ダミー値 - 音声機能は一時的に無効）
echo "dummy-openai-key-for-deploy-test" | gcloud secrets versions add openai-api-key --data-file=-
echo "✅ OpenAI API Key（ダミー）を設定"

# Stripe（ダミー値）
echo "sk_test_dummy_stripe_key" | gcloud secrets versions add stripe-secret-key --data-file=-
echo "pk_test_dummy_stripe_public" | gcloud secrets versions add stripe-publishable-key --data-file=-
echo "whsec_dummy_webhook_secret" | gcloud secrets versions add stripe-webhook-secret --data-file=-
echo "✅ Stripe設定（ダミー）を設定"

# AWS S3（ダミー値）
echo "AKIAXXXXXXXXXXXXXXXX" | gcloud secrets versions add aws-access-key-id --data-file=-
echo "dummy-aws-secret-key" | gcloud secrets versions add aws-secret-access-key --data-file=-
echo "kimotimikke-test-bucket" | gcloud secrets versions add s3-bucket-name --data-file=-
echo "✅ AWS設定（ダミー）を設定"

# Firebase（ダミー値）
echo "teamb-finalpj" | gcloud secrets versions add firebase-project-id --data-file=-
echo '{"type":"service_account","project_id":"teamb-finalpj","private_key_id":"dummy","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDummy\n-----END PRIVATE KEY-----\n","client_email":"dummy@teamb-finalpj.iam.gserviceaccount.com","client_id":"dummy","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}' | gcloud secrets versions add firebase-service-account --data-file=-
echo "✅ Firebase設定（ダミー）を設定"

# アプリケーションシークレット
app_secret="kimotimikke-secret-$(date +%s)"
echo "$app_secret" | gcloud secrets versions add app-secret-key --data-file=-
echo "✅ アプリケーションシークレットを設定"

echo ""
echo "🎉 デプロイテスト用設定完了！"
echo ""
echo "⚠️  注意: これはデプロイテスト用のダミー値です"
echo "    実際の運用前に本物のAPI Keyに更新してください"
echo ""
echo "次のステップ: Cloud Runデプロイテスト"
