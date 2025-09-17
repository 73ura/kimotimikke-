'use client';

import { HamburgerMenu, KokoronDefault, SpeechBubble } from '@/components/ui';
import { colors, commonStyles, fontSize, spacing } from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EmotionEducationPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('what');

  const handleBack = () => {
    router.push('/app');
  };

  const educationContent = {
    what: {
      title: '感情教育とは？',
      content: `### 感情教育とは

非認知能力の中でも「感情と人間関係」に関わる力を集中的に伸ばす教育で、非認知能力全体を育む土台となります。

### 育てる力

感情教育では、以下の力を育むことを目的としています：

- 自分の感情を理解する力
- 感情を適切に表現・コントロールする力
- 他者と健全な関係を築く力

### 多様な感情を理解する

怒りや悲しみといったネガティブな感情だけでなく、喜びや驚きなど多様な感情も理解し、言葉で表現できるようにすることで、共感力や信頼、社会的スキル全般の向上も期待できます。`,
    },
    importance: {
      title: 'なぜ大切なのか？',
      content: `### 自己理解・自己肯定感の向上

感情に気づき、名前をつけて表現できるようになることで、自己理解が深まり、「自分はこれでいい」と思える自己肯定感が育まれます。

### 対人関係・コミュニケーション力の向上

自分の感情を適切に伝え、相手の感情にも気づけるようになることで、友だちや家族との信頼関係がスムーズに築けます。共感や思いやりも育まれます。

### 問題解決力・ストレス耐性の強化

感情を調整できる力は、ストレスがかかる場面でも冷静に対応するためのレジリエンス（困難を乗り越える力）や、問題解決力の土台になります。

### 学業・将来の成功への影響

幼児期から感情教育に取り組むことで、学びの姿勢、人間関係、仕事など、将来の社会的成功にも良い影響を与えることが研究でも示されています。

これらは「学びに向かう力・人間性」として、「知識・技能」「思考力・判断力・表現力」と並び、学校教育の重要な目標とされています。`,
    },
  };

  const currentContent =
    educationContent[activeSection as keyof typeof educationContent];

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
          感情教育について
        </h1>

        {/* ナビゲーションタブ */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          {Object.entries(educationContent).map(([key, content]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              style={{
                background:
                  activeSection === key
                    ? colors.primary
                    : colors.background.light,
                color:
                  activeSection === key
                    ? colors.text.white
                    : colors.text.primary,
                border:
                  activeSection === key
                    ? 'none'
                    : `1px solid ${colors.border.light}`,
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
              }}
            >
              {content.title}
            </button>
          ))}
        </div>

        {/* コンテンツ表示 */}
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <h2
            style={{
              fontSize: fontSize.xl,
              fontWeight: 'bold',
              color: colors.text.primary,
              marginBottom: spacing.md,
              textAlign: 'center',
            }}
          >
            {currentContent.title}
          </h2>

          <div style={{ textAlign: 'left' }}>
            <SpeechBubble text={currentContent.content} />
          </div>
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
