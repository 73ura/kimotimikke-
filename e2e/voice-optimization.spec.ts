import { expect, test } from "@playwright/test";

test.describe("音声録音ページ", () => {
  test("認証なしで音声録音ページにアクセスするとリダイレクトされる", async ({
    page,
  }) => {
    // 認証なしでアクセス
    await page.goto("/app/voice");

    // 読み込み完了を待つ
    await page.waitForLoadState("networkidle");

    // ログインページまたはトップページにリダイレクトされることを確認
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(login|$)/);
  });

  test("音声録音ページへの直接アクセスは認証チェックされる", async ({
    page,
  }) => {
    // 認証なしで音声録音ページに直接アクセス
    await page.goto(
      "/app/voice?emotion=69e6199e-8177-4ec4-a537-3587d7e3542a&intensity=medium&child=bc4357c0-5a7e-4aec-b1bb-d761cf8b16ef"
    );

    // 読み込み完了を待つ
    await page.waitForLoadState("networkidle");

    // 認証が必要なのでリダイレクトされることを確認
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(login|$)/);
  });
});
