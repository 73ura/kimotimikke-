'use client';

import { HamburgerMenu, KokoronDefault, SpeechBubble } from '@/components/ui';
import { colors, commonStyles, spacing } from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TipsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('daily');

  const handleBack = () => {
    router.push('/app');
  };

  const tipsContent = `### 1. 感情に名前をつけてみましょう

「悲しい？悔しい？モヤモヤする？」など、感情の選択肢を言葉で示してあげることで、お子さまの語彙が豊かになります。

### 2. 共感の言葉を意識しましょう

「そうだったんだね」「○○って思ったんだね」と、まずは気持ちを代弁して受け止めてあげてください。アドバイスよりも、**共感が先**です。

### 3. ネガティブな感情も大切に

「怒ってもいいよ、でも叩くのはダメだよ」と、感情そのものは受け入れ、行動は優しく区別して伝えましょう。

### 4. 一緒に感情を振り返る習慣を

寝る前や週末など、アプリを見ながら「今週はどんな気持ちがあったかな？」と、親子でゆったりと振り返る時間を設けてみてください。

### 5. 保護者の感情リテラシーも見せてあげましょう

「今日はママもイライラしちゃったけど、深呼吸して落ち着いたよ」など、大人の気持ちの扱い方をことばで伝えることが、素敵なお手本になります。

### 6. 感情を否定せず、そのまま受け止めて

「泣かないで」よりも、「泣きたくなるくらい悲しかったんだね」と共感の気持ちで応えてあげてください。

### 7. 感情語を遊びながら増やしてみましょう

「"くやしい"ってどんなとき？」「"そわそわ"ってどんな感じ？」など、カードを使ったクイズ形式の遊びがおすすめです♪

### 8. 怒りの奥にある気持ちを一緒に探ってみましょう

「どうして怒っているのかな？」と、お子さま自身が理由や気持ちに気づけるよう寄り添ってあげましょう。

### 9. 感情と行動のお約束を決めてみましょう

「どんな気持ちもOK。でも人は叩かない」など、シンプルでわかりやすいルールを、お子さまと一緒に考えてみてください。

### 10. 感情の"天気予報ごっこ"をしてみましょう

「今日は晴れ？くもり？雷かな？」と、気分をお天気で表現することで、自分の状態を伝えやすくなります。

### 11. 落ち着ける"安心ゾーン"をつくりましょう

クッションやぬいぐるみのスペースなど、お子さまが気持ちを整えられる「安心の場所」を一緒に準備してみましょう。

### 12. 失敗したときの気持ちにも寄り添って

「残念だったね。でもチャレンジできて偉かったよ」と、**結果よりも過程や気持ち**を大切にして声をかけてあげてください。

### 13. トラブルも学びのチャンスに

ケンカの後は、「どうして悲しかったのかな？」「相手はどう感じたと思う？」と、一緒に気持ちを整理する時間をとってみてください。

### 14. 感情と行動をつなぐ言葉を育てましょう

「イライラしたときは、どうしたらいいと思う？」と、気持ちと行動をつなぐ言葉がけを意識しましょう。具体的な対処法を一緒に考えるのも効果的です。

### 15. 絵本を通して感情を"外から見る"体験を

絵本を読んだ後に「この子、どんな気持ちだったと思う？」と問いかけることで、他者理解や共感力を育むことができます。`;

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
          保護者向けTips
        </h1>

        {/* コンテンツ表示 */}
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <SpeechBubble text={tipsContent} />
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
