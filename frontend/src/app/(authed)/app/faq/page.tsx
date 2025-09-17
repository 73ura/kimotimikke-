'use client';

import { HamburgerMenu, KokoronDefault, SpeechBubble } from '@/components/ui';
import { colors, commonStyles, spacing } from '@/styles/theme';
import { useRouter } from 'next/navigation';

export default function FAQPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/app');
  };

  const faqContent = `### Q. このアプリは何歳から使えますか？

A. お子さまの年齢や発達段階に合わせて使える設計ですが、主に3歳〜5歳を対象としています。

### Q. 感情カードの種類はどれくらいありますか？

A. 基本の12種類の感情に、それぞれ3段階の強さを組み合わせて用意しています。

### Q. 1日どれくらい使えばいいですか？

A. 1日3〜5分程度です。大事なのは"継続"です。

### Q. 子どもが感情カードを選ばないときは？

A. 「今日は○○な気分かな？」とヒントを出してみてください。

### Q. 音声入力がうまくいきません…

A. アプリでマイクの設定を確認して、静かな場所で再度録音してみてください。

### Q. 子どもがネガティブな気持ちばかり選びます

A. ネガティブな感情も自己理解や自己調整の大切な一部です。否定せず「どうしてそう思ったの？」と声をかけて子供の感情の深掘りにつなげて、対話のきっかけにしてください。

### Q. 子どもがアプリを使いたがりません

A. 一緒に使ってみましょう。親御さんが楽しそうに使っている姿はお子さんの興味を引きます。最初は一緒に触って、感情カードを見ながらお話する時間にしてみてください。`;

  return (
    <div style={commonStyles.page.container}>
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
          よくある質問（FAQ）
        </h1>

        {/* コンテンツ表示 */}
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <SpeechBubble text={faqContent} />
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
