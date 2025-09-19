#!/bin/bash

# Cloud Run起動スクリプト
set -e

echo "🚀 Cloud Run起動処理を開始..."

# 環境変数の確認
echo "📋 環境変数を確認中..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL が設定されていません"
    exit 1
fi

# データベースマイグレーションの実行
echo "🔄 データベースマイグレーションを実行中..."
alembic upgrade head

# アプリケーションの起動
echo "✅ アプリケーションを起動します..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --timeout-keep-alive 30
