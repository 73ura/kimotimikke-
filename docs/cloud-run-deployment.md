# Cloud Run デプロイメントガイド

## 概要

このドキュメントでは、感情教育アプリのバックエンドを Google Cloud Run にデプロイする手順を説明します。

## 前提条件

- Google Cloud Platform アカウント
- gcloud CLI がインストール済み
- Docker がインストール済み
- プロジェクトの権限（Cloud Run Admin, Secret Manager Admin 等）

## 1. Google Cloud プロジェクトの設定

### 1.1 プロジェクトの作成と選択

```bash
# 新しいプロジェクトを作成（必要に応じて）
gcloud projects create YOUR_PROJECT_ID

# プロジェクトを選択
gcloud config set project YOUR_PROJECT_ID
```

### 1.2 必要な API の有効化

```bash
# 必要なAPIを有効化
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## 2. シークレットの設定

### 2.1 Secret Manager の設定

```bash
# シークレット設定スクリプトを実行
./scripts/setup-secrets.sh YOUR_PROJECT_ID
```

### 2.2 シークレット値の設定

各シークレットに実際の値を設定します：

```bash
# データベースURL
echo "postgresql+asyncpg://user:password@host:port/database" | \
  gcloud secrets versions add database-url --data-file=- --project=YOUR_PROJECT_ID

# OpenAI API Key
echo "your-openai-api-key" | \
  gcloud secrets versions add openai-api-key --data-file=- --project=YOUR_PROJECT_ID

# その他のシークレットも同様に設定...
```

## 3. サービスアカウントの設定

### 3.1 サービスアカウントの作成

```bash
# Cloud Run用サービスアカウントを作成
gcloud iam service-accounts create teamb-cloud-run \
  --display-name="TeamB Cloud Run Service Account" \
  --project=YOUR_PROJECT_ID
```

### 3.2 権限の付与

```bash
# Secret Manager へのアクセス権限
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:teamb-cloud-run@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Cloud SQL 接続権限（必要に応じて）
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:teamb-cloud-run@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

## 4. デプロイメント

### 4.1 手動デプロイ

```bash
# backendディレクトリに移動
cd backend

# Cloud Build を使用してデプロイ
gcloud builds submit --config cloudbuild.yaml \
  --substitutions COMMIT_SHA=$(git rev-parse HEAD) \
  --project YOUR_PROJECT_ID
```

### 4.2 GitHub Actions による自動デプロイ

GitHub リポジトリの Secrets に以下を設定：

- `GCP_SA_KEY`: サービスアカウントキー（JSON 形式）
- `GCP_PROJECT_ID`: Google Cloud プロジェクト ID
- `CLOUD_RUN_SERVICE_URL`: デプロイされた Cloud Run サービスの URL

## 5. デプロイ後のテスト

### 5.1 デプロイメントテストの実行

```bash
# デプロイテストスクリプトを実行
./scripts/deploy-test.sh YOUR_PROJECT_ID https://your-service-url.run.app
```

### 5.2 統合テストの実行

```bash
# Cloud Run統合テストを実行
cd backend
CLOUD_RUN_SERVICE_URL=https://your-service-url.run.app pytest tests/test_cloud_run_integration.py -v
```

## 6. 監視とログ

### 6.1 ログの確認

```bash
# Cloud Run サービスのログを確認
gcloud logs read --project=YOUR_PROJECT_ID \
  --resource-type="cloud_run_revision" \
  --log-filter="resource.labels.service_name=teamb-backend"
```

### 6.2 メトリクスの確認

```bash
# サービスの状態を確認
gcloud run services describe teamb-backend \
  --region=asia-northeast1 \
  --project=YOUR_PROJECT_ID
```

## 7. トラブルシューティング

### よくある問題

1. **権限エラー**: サービスアカウントの権限を確認
2. **シークレットアクセスエラー**: Secret Manager の設定を確認
3. **データベース接続エラー**: データベース URL とネットワーク設定を確認

### ログの確認方法

```bash
# リアルタイムでログを監視
gcloud logs tail --project=YOUR_PROJECT_ID \
  --resource-type="cloud_run_revision" \
  --log-filter="resource.labels.service_name=teamb-backend"
```

## 8. 本番環境での推奨事項

- **セキュリティ**: 認証を有効にし、適切な IAM ポリシーを設定
- **監視**: Cloud Monitoring でアラートを設定
- **バックアップ**: データベースの定期バックアップを設定
- **スケーリング**: 負荷に応じてインスタンス数を調整

## 参考資料

- [Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [Secret Manager ドキュメント](https://cloud.google.com/secret-manager/docs)
- [Cloud Build ドキュメント](https://cloud.google.com/build/docs)
