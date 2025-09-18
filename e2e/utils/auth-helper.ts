import { Page, expect } from "@playwright/test";
import { GoogleAuthHelper } from "./google-auth";

export class AuthTestHelper {
  /**
   * Mock認証を設定し、認証状態を確認
   */
  async setupMockAuth(page: Page, googleAuth: GoogleAuthHelper) {
    await googleAuth.mockGoogleAuthSuccess();
    await page.waitForTimeout(1000);
    const authState = await googleAuth.checkAuthState();
    expect(authState).toBeTruthy();
    return authState;
  }

  /**
   * プライシングページに遷移
   */
  async navigateToPricing(page: Page) {
    await page.goto("/pricing");
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/pricing$/);
  }

  /**
   * 認証状態を確認
   */
  async verifyAuthState(page: Page, googleAuth: GoogleAuthHelper) {
    const authState = await googleAuth.checkAuthState();
    expect(authState).toBeTruthy();
    return authState;
  }

  /**
   * 認証失敗を設定
   */
  async setupAuthFailure(page: Page, googleAuth: GoogleAuthHelper) {
    await googleAuth.mockGoogleAuthFailure();
    const authState = await googleAuth.checkAuthState();
    expect(authState).toBeNull();
    return authState;
  }

  /**
   * Googleログインボタンをクリックしてポップアップを開く
   */
  async openGoogleAuthPopup(page: Page, googleAuth: GoogleAuthHelper) {
    await googleAuth.checkGoogleLoginButton();
    await googleAuth.clickGoogleLoginButton();
    const popupResult = await googleAuth.handleGoogleAuthPopup();
    expect(popupResult.opened).toBe(true);
    return popupResult;
  }

  /**
   * 認証フローの完全なセットアップ（サブスクリプション登録済み）
   */
  async setupCompleteAuthFlow(page: Page, googleAuth: GoogleAuthHelper) {
    await page.goto("/login");
    await this.setupMockAuthWithSubscription(page, googleAuth);
    await this.navigateToApp(page);
  }

  /**
   * アプリページに遷移
   */
  async navigateToApp(page: Page) {
    await page.goto("/app");
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/app$/);
  }

  /**
   * サブスクリプション未登録のMock認証を設定
   */
  async setupMockAuthWithoutSubscription(
    page: Page,
    googleAuth: GoogleAuthHelper
  ) {
    await googleAuth.mockGoogleAuthSuccess();
    await page.waitForTimeout(1000);

    // サブスクリプション未登録の状態をMock
    await page.route("**/api/v1/stripe/subscription/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          has_subscription: false,
          is_trial: false,
          status: "none",
          is_paid: false,
          trial_expires_at: null,
        }),
      });
    });

    const authState = await googleAuth.checkAuthState();
    expect(authState).toBeTruthy();
    return authState;
  }

  /**
   * サブスクリプション登録済みのMock認証を設定
   */
  async setupMockAuthWithSubscription(
    page: Page,
    googleAuth: GoogleAuthHelper
  ) {
    await googleAuth.mockGoogleAuthSuccess();
    await page.waitForTimeout(1000);

    // サブスクリプション登録済みの状態をMock
    await page.route("**/api/v1/stripe/subscription/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          has_subscription: true,
          is_trial: true,
          status: "active",
          is_paid: false,
          trial_expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7日後
        }),
      });
    });

    const authState = await googleAuth.checkAuthState();
    expect(authState).toBeTruthy();
    return authState;
  }
}
