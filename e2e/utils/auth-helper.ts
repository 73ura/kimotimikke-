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
   * 認証フローの完全なセットアップ
   */
  async setupCompleteAuthFlow(page: Page, googleAuth: GoogleAuthHelper) {
    await page.goto("/login");
    await this.setupMockAuth(page, googleAuth);
    await this.navigateToPricing(page);
  }
}
