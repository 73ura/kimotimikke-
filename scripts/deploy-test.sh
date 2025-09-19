#!/bin/bash

# Cloud Run デプロイメントテストスクリプト
# 使用方法: ./deploy-test.sh PROJECT_ID SERVICE_URL

PROJECT_ID=$1
SERVICE_URL=$2

if [ -z "$PROJECT_ID" ] || [ -z "$SERVICE_URL" ]; then
    echo "使用方法: $0 <PROJECT_ID> <SERVICE_URL>"
    echo "例: $0 my-project https://teamb-backend-xxx-an.a.run.app"
    exit 1
fi

echo "🚀 Cloud Run デプロイメントテストを開始..."

# ヘルスチェックエンドポイントのテスト
echo "📋 ヘルスチェックをテスト中..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/v1/voice/health")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ ヘルスチェック成功 (HTTP $HEALTH_RESPONSE)"
else
    echo "❌ ヘルスチェック失敗 (HTTP $HEALTH_RESPONSE)"
    exit 1
fi

# APIエンドポイントの基本テスト
echo "📋 基本APIエンドポイントをテスト中..."

# 認証が必要ないエンドポイントのテスト
ENDPOINTS=(
    "/api/v1/voice/health"
    "/docs"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "  テスト中: $endpoint"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL$endpoint")
    
    if [ "$RESPONSE" = "200" ]; then
        echo "  ✅ $endpoint (HTTP $RESPONSE)"
    else
        echo "  ⚠️ $endpoint (HTTP $RESPONSE) - 認証が必要な可能性があります"
    fi
done

# レスポンス時間のテスト
echo "📋 レスポンス時間をテスト中..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL/api/v1/voice/health")
echo "  レスポンス時間: ${RESPONSE_TIME}秒"

if (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    echo "  ✅ レスポンス時間が適切です"
else
    echo "  ⚠️ レスポンス時間が長すぎます (5秒以上)"
fi

# Cloud Run メトリクスの確認
echo "📋 Cloud Run メトリクスを確認中..."
gcloud run services describe teamb-backend \
    --region=asia-northeast1 \
    --project=$PROJECT_ID \
    --format="value(status.conditions[0].status,status.conditions[0].message)" 2>/dev/null

echo "✅ デプロイメントテストが完了しました"
