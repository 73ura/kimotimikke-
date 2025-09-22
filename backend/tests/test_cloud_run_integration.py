"""
Cloud Run 統合テスト
デプロイ後のCloud Run環境での動作確認テスト
"""

import os
import pytest
import requests
from typing import Optional


class TestCloudRunIntegration:
    """Cloud Run統合テストクラス"""

    @pytest.fixture(scope="class")
    def service_url(self) -> Optional[str]:
        """Cloud RunサービスのURLを取得"""
        return os.getenv("CLOUD_RUN_SERVICE_URL")

    @pytest.fixture(scope="class")
    def skip_if_no_url(self, service_url):
        """サービスURLが設定されていない場合はスキップ"""
        if not service_url:
            pytest.skip("CLOUD_RUN_SERVICE_URL環境変数が設定されていません")

    def test_health_endpoint(self, service_url, skip_if_no_url):
        """ヘルスチェックエンドポイントのテスト"""
        response = requests.get(f"{service_url}/api/v1/voice/health", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"

    def test_docs_endpoint(self, service_url, skip_if_no_url):
        """API ドキュメントエンドポイントのテスト"""
        response = requests.get(f"{service_url}/docs", timeout=30)
        assert response.status_code == 200

    def test_openapi_endpoint(self, service_url, skip_if_no_url):
        """OpenAPI仕様エンドポイントのテスト"""
        response = requests.get(f"{service_url}/openapi.json", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        assert "openapi" in data
        assert "info" in data

    def test_response_time(self, service_url, skip_if_no_url):
        """レスポンス時間のテスト"""
        import time
        
        start_time = time.time()
        response = requests.get(f"{service_url}/api/v1/voice/health", timeout=30)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 5.0, f"レスポンス時間が遅すぎます: {response_time:.2f}秒"

    def test_cors_headers(self, service_url, skip_if_no_url):
        """CORSヘッダーのテスト"""
        response = requests.options(
            f"{service_url}/api/v1/voice/health",
            headers={"Origin": "https://example.com"},
            timeout=30
        )
        
        # CORSが適切に設定されていることを確認
        assert "access-control-allow-origin" in response.headers.keys() or \
               "Access-Control-Allow-Origin" in response.headers.keys()

    def test_database_connection(self, service_url, skip_if_no_url):
        """データベース接続のテスト（認証が必要な場合はスキップ）"""
        # 認証が必要ないデータベース関連のエンドポイントがあればテスト
        # 現在は基本的なヘルスチェックのみ
        response = requests.get(f"{service_url}/api/v1/voice/health", timeout=30)
        assert response.status_code == 200

    @pytest.mark.slow
    def test_load_handling(self, service_url, skip_if_no_url):
        """軽い負荷テスト（複数リクエスト）"""
        import concurrent.futures
        import threading
        
        def make_request():
            response = requests.get(f"{service_url}/api/v1/voice/health", timeout=30)
            return response.status_code
        
        # 10個の並行リクエストを送信
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # すべてのリクエストが成功することを確認
        assert all(status == 200 for status in results)
        assert len(results) == 10
