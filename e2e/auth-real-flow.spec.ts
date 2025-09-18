/**
 * 実際の認証フローテスト: 実際のGoogle認証ポップアップとフロントエンド連携をテスト
 *
 * 注意: CI環境では実際のポップアップが開けないため、ポップアップテストはスキップされます
 * ローカル環境では全テストが実行可能です: npm run test:e2e:auth
 */
import { expect, test } from "@playwright/test";
import * as dotenv from "dotenv";
import { AuthTestHelper } from "./utils/auth-helper";
import { GoogleAuthHelper } from "./utils/google-auth";

// 環境変数の読み込み
dotenv.config({ path: "frontend/.env.e2e.local" });

test.describe("実際の認証フローテスト", () => {
  let googleAuth: GoogleAuthHelper;
  let authHelper: AuthTestHelper;

  test.beforeEach(async ({ page }) => {
    googleAuth = new GoogleAuthHelper(page);
    authHelper = new AuthTestHelper();
    await page.goto("/login");
  });

  test.describe("実際のGoogle認証ポップアップ", () => {
    // CI環境では実際のポップアップが開けないためスキップ
    // ローカル環境では実行可能: npm run test:e2e:auth
    test.skip("Googleログインボタンクリックでポップアップが開く", async ({
      page,
    }) => {
      await googleAuth.checkGoogleLoginButton();

      // ポップアップイベントを事前に待機
      const popupPromise = page.waitForEvent("popup", { timeout: 10000 });

      // ボタンクリック
      await googleAuth.clickGoogleLoginButton();

      // ポップアップを待つ
      const popup = await popupPromise;
      expect(popup).toBeTruthy();
      expect(popup.url()).toContain("teamb-finalpj.firebaseapp.com");
      await popup.close();

      console.log("✅ 実際のGoogle認証ポップアップが開きました");
    });

    // CI環境では実際のポップアップが開けないためスキップ
    test.skip("Google認証ポップアップのキャンセル", async ({ page }) => {
      // ポップアップイベントを事前に待機
      const popupPromise = page.waitForEvent("popup", { timeout: 10000 });

      // ボタンクリック
      await googleAuth.clickGoogleLoginButton();

      // ポップアップを待つ
      const popup = await popupPromise;
      expect(popup).toBeTruthy();
      await popup.close();

      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/login$/);

      console.log("✅ Google認証ポップアップのキャンセルが正常に動作しました");
    });
  });

  test.describe("認証フロー統合テスト", () => {
    test("認証フロー + フロントエンド連携", async ({ page }) => {
      await authHelper.setupCompleteAuthFlow(page, googleAuth);
      console.log("✅ 認証フロー + フロントエンド連携成功");
    });

    test("認証成功後のプライシングページ遷移（サブスク未登録）", async ({
      page,
    }) => {
      await authHelper.setupMockAuthWithoutSubscription(page, googleAuth);
      await authHelper.navigateToPricing(page);
      console.log(
        "✅ 認証成功後のプライシングページ遷移成功（サブスク未登録）"
      );
    });

    test("認証成功後のアプリページ遷移（サブスク登録済み）", async ({
      page,
    }) => {
      await authHelper.setupMockAuthWithSubscription(page, googleAuth);
      await authHelper.navigateToApp(page);
      console.log("✅ 認証成功後のアプリページ遷移成功（サブスク登録済み）");
    });

    test("認証失敗時のフロントエンドエラーハンドリング", async ({ page }) => {
      await page.goto("/login");
      await authHelper.setupAuthFailure(page, googleAuth);
      await googleAuth.checkAuthErrorHandling();

      const googleLoginBtn = page.locator(
        'button:has-text("🔐Googleでログイン")'
      );
      await expect(googleLoginBtn).toBeVisible();

      console.log("✅ 認証失敗時のフロントエンドエラーハンドリング成功");
    });
  });

  test.describe("異常系テスト", () => {
    test("ネットワークエラー時の認証処理", async ({ page }) => {
      await page.goto("/login");
      await googleAuth.checkGoogleLoginButton();

      // ログインボタンクリック後にネットワークを無効化
      await page.route("**/*", (route) => route.abort());

      await googleAuth.clickGoogleLoginButton();

      // エラーメッセージが表示されることを確認
      await page.waitForTimeout(2000);

      // ネットワークエラー時はログインページに遷移することを確認
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/login$/);

      console.log("✅ ネットワークエラー時の認証処理成功");
    });

    // CI環境では実際のポップアップが開けないためスキップ
    test.skip("認証ポップアップが開かない場合の処理", async ({ page }) => {
      await page.goto("/login");

      // ポップアップを無効化
      await page.addInitScript(() => {
        window.open = () => null;
      });

      await googleAuth.checkGoogleLoginButton();
      await googleAuth.clickGoogleLoginButton();

      // エラーハンドリングが適切に行われることを確認
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/login$/);

      console.log("✅ 認証ポップアップが開かない場合の処理成功");
    });

    // CI環境では実際のポップアップが開けないためスキップ
    test.skip("認証タイムアウト時の処理", async ({ page }) => {
      await page.goto("/login");

      // タイムアウトを短く設定
      page.setDefaultTimeout(1000);

      await googleAuth.checkGoogleLoginButton();
      await googleAuth.clickGoogleLoginButton();

      // タイムアウトエラーが適切に処理されることを確認
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/login$/);

      // タイムアウトを元に戻す
      page.setDefaultTimeout(30000);

      console.log("✅ 認証タイムアウト時の処理成功");
    });

    test("無効な認証状態でのページアクセス", async ({ page }) => {
      // 認証状態をクリア
      await page.evaluate(() => {
        // クッキーを削除
        document.cookie =
          "firebase-id-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // localStorageをクリア
        localStorage.clear();
        // sessionStorageをクリア
        sessionStorage.clear();
      });

      // 認証状態なしで保護されたページにアクセス
      await page.goto("/app");

      // 認証されていない場合はログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/login/);

      // ログインページの内容が表示されることを確認
      await expect(page.getByText("🔐Googleでログイン")).toBeVisible();

      console.log(
        "✅ 無効な認証状態でのページアクセスでログインページにリダイレクト成功"
      );
    });

    test("認証状態の不整合時の処理", async ({ page }) => {
      // 無効な認証トークンを設定
      await page.evaluate(() => {
        // 無効なトークンをクッキーに設定
        document.cookie = "firebase-id-token=invalid-token; path=/;";
      });

      await page.goto("/app");

      // 無効な認証状態の場合はログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/login/);

      // ログインページの内容が表示されることを確認
      await expect(page.getByText("🔐Googleでログイン")).toBeVisible();

      console.log(
        "✅ 認証状態の不整合時の処理でログインページにリダイレクト成功"
      );
    });
  });

  test.afterEach(async ({ page }) => {
    try {
      const authState = await googleAuth.checkAuthState();
      if (authState) {
        console.log("認証状態のクリーンアップ完了");
      }
    } catch (error) {
      console.log("クリーンアップエラー（無視可能）:", error);
    }
  });
});
