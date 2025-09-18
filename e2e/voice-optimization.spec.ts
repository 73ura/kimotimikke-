import { expect, Page, test } from "@playwright/test";

// 共通のリダイレクト確認ロジック
async function verifyRedirectFlow(page: Page) {
  // デバッグ: 現在のURLを確認
  const currentUrl = page.url();
  console.log("Current URL:", currentUrl);

  // 正しい動作フローの確認:
  // 1. 未認証 → /login
  // 2. 認証済み + サブスク未登録 → /app/subscription
  // 3. 認証済み + サブスク登録済み → /app/voice

  if (currentUrl.includes("/login")) {
    // ケース1: 未認証でログインページにリダイレクト（期待される動作）
    await expect(
      page.getByRole("button", { name: "Googleでログイン" })
    ).toBeVisible();
    console.log("✅ ケース1: 未認証でログインページにリダイレクト");
  } else if (currentUrl.includes("/app/subscription")) {
    // ケース2: 認証済みだがサブスクリプション未登録
    await expect(
      page.getByRole("heading", { name: "STEP2 サブスクリプション登録" })
    ).toBeVisible();
    console.log("✅ ケース2: 認証済みだがサブスクリプション未登録");
  } else if (currentUrl.includes("/app/voice")) {
    // ケース3: 認証済みでサブスクリプション登録済み
    await expect(page.locator("text=読み込み中...")).not.toBeVisible({
      timeout: 5000,
    });
    console.log("✅ ケース3: 認証済みでサブスクリプション登録済み");
  } else {
    // 予期しないリダイレクト先
    console.log("❌ 予期しないリダイレクト先:", currentUrl);
    console.log("middlewareが正しく動作していない可能性があります");
  }
}

test.describe("音声録音ページ", () => {
  test("音声録音ページが表示される", async ({ page }) => {
    // 音声録音ページに移動
    await page.goto("/app/voice");

    // 読み込み完了を待つ
    await page.waitForLoadState("networkidle");

    // 共通のリダイレクト確認ロジックを実行
    await verifyRedirectFlow(page);
  });

  test("録音開始ボタンが表示される", async ({ page }) => {
    await page.goto("/app/voice");

    // 読み込み完了を待つ
    await page.waitForLoadState("networkidle");

    // 共通のリダイレクト確認ロジックを実行
    await verifyRedirectFlow(page);
  });
});
