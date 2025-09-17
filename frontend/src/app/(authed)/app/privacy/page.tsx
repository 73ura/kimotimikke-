'use client';

import { HamburgerMenu, KokoronDefault, SpeechBubble } from '@/components/ui';
import { colors, commonStyles, spacing } from '@/styles/theme';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/app');
  };

  const privacyContent = `### プライバシーポリシー

このプライバシーポリシー（以下、「本プライバシーポリシー」といいます）は、きもちみっけ！（以下、「本アプリ」といいます）に関するサービス（以下、「本サービス」といいます）をユーザーが利用されるにあたり、当社が取得する個人情報等の取扱いについて定めるものです。

### 1. 定義

個人情報: 生存する個人に関する情報であって、氏名、生年月日、住所、電話番号、連絡先、その他の記述等により特定の個人を識別できる情報

データ情報: ユーザーが当社のウェブサイト上で閲覧したページの履歴、利用日時や方法、利用環境、ユーザーのIPアドレス、端末の個体識別情報、クッキー、ログファイルなど

### 2. 個人情報の取得

当社は、ユーザーが本サービスを利用されるにあたり、以下の個人情報等を取得することがあります：

- お子様の年齢・性別
- 感情記録データ
- 音声録音データ
- アプリ使用履歴
- 端末ID情報

### 3. 同意

本サービスを利用することにより、ユーザーの個人情報等を当社が利用することについて同意をいただいたものとします。ユーザーは、いつでも同意を撤回することができます。

### 4. 個人情報の利用目的

- 本サービスの提供・運営
- ユーザーサポート・お問い合わせ対応
- サービスの改善・開発
- 利用状況の分析・統計

### 5. 個人情報の管理

当社は、ユーザーの個人情報の適正な保護を重大な責務と認識し、個人情報保護法に定める義務を履行するとともに、ユーザーのプライバシーを尊重いたします。

### 6. 第三者提供

当社は、ユーザーの同意なく、個人情報を第三者に提供することはありません。ただし、法令に基づく場合や、ユーザーの生命・身体・財産の保護のために必要な場合を除きます。

### 7. 外部サービスの利用

本サービスでは、以下の外部サービスを利用しています：

- Google Analytics: 利用状況の分析
- Google Cloud Speech API: 音声認識機能
- Firebase: データ管理・分析

### 8. セキュリティ

当社は、ユーザーの個人情報等を保護するため、合理的なセキュリティ対策を講じています。ただし、インターネット経由での情報送信については、完全なセキュリティを保証するものではありません。

### 9. お問い合わせ

個人情報の取扱いに関するお問い合わせや、個人情報の開示・訂正・利用停止等のご要望がございましたら、お気軽にお問い合わせください。

### 10. プライバシーポリシーの変更

本プライバシーポリシーは、必要に応じて変更される場合があります。変更があった場合は、本アプリ内でお知らせいたします。

最終更新日: 2025年8月`;

  return (
    <div
      style={{
        ...commonStyles.page.container,
        overflow: 'auto', // スクロール可能にするため
      }}
    >
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />

      {/* 左上の戻るボタン */}
      <button
        onClick={handleBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          color: '#000000',
          zIndex: 200,
          fontWeight: 'bold',
        }}
      >
        ← もどる
      </button>

      {/* メインコンテンツ */}
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 0,
          padding: '20px',
          zIndex: 50,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '600px',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {/* タイトル */}
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '40px 0 20px 0',
            color: '#333',
          }}
        >
          プライバシーポリシー
        </h1>

        {/* コンテンツ表示 */}
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <SpeechBubble text={privacyContent} />
        </div>

        {/* こころん */}
        <div style={{ margin: '20px 0 0 0' }}>
          <KokoronDefault size={200} />
        </div>

        {/* 次のステップ */}
        <div
          style={{
            textAlign: 'center',
            marginTop: spacing.lg,
          }}
        >
          <button
            onClick={() => router.push('/app/emotion-selection')}
            style={{
              ...commonStyles.button.base,
              ...commonStyles.button.primary,
              fontSize: '25px',
              padding: '30px 60px',
              minWidth: '240px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow =
                '0 4px 12px rgba(255,107,107,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = colors.shadow.medium;
            }}
          >
            感情記録を始める
          </button>
        </div>
      </div>
    </div>
  );
}
