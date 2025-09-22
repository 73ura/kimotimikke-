//TODO: もとのロールプレイ画面。バックアップ用で、ロールプレイが完全に実装できたら削除する。
'use client';

import {
  HamburgerMenu,
  KokoronDefault,
  MenuItem,
  SpeechBubble,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  borderRadius,
  colors,
  commonStyles,
  fontSize,
  spacing,
} from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

type Scenario = { title: string; color: string; description?: string };
type Emotion = { id: string; label: string; color: string; image_url: string };

// 感情ラベルを自然な日本語に整える関数
function getEmotionPhrase(emotion: Emotion): string {
  switch (emotion.id) {
    case 'fuyukai':
      return 'ふゆかいなきもち';
    case 'ikari':
      return 'いかりのきもち';
    default:
      return `${emotion.label}きもち`;
  }
}

// デフォルト感情カード
const DEFAULT_EMOTIONS: Emotion[] = [
  {
    id: 'kanashii',
    label: 'かなしい',
    color: colors.secondary,
    image_url: '/images/emotions/kanashii.webp',
  },
  {
    id: 'komatta',
    label: 'こまった',
    color: colors.secondary,
    image_url: '/images/emotions/komatta.webp',
  },
  {
    id: 'fuyukai',
    label: 'ふゆかい',
    color: colors.primary,
    image_url: '/images/emotions/fuyukai.webp',
  },
  {
    id: 'ikari',
    label: 'いかり',
    color: colors.primary,
    image_url: '/images/emotions/ikari.webp',
  },
];

// シナリオ
const SCENARIOS: Scenario[] = [
  {
    title: 'おもちゃをおともだちにとられた',
    description: 'おともだちに おもちゃを とられたら…どんな きもちかな？',
    color: colors.primary,
  },
  { title: 'おともだちとけんか\nしちゃった', color: colors.secondary },
  { title: 'はっぴょうかいで\nセリフをまちがえた', color: '#51cf66' },
  { title: 'おもちゃをかって\nもらえなかった', color: '#ff8cc8' },
  { title: 'えを「へただね」と\nいわれた', color: '#74c0fc' },
];

// ページ専用モーダル
function RoleplayModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.background.white,
          borderRadius: borderRadius.large,
          padding: spacing.xl,
          maxWidth: '360px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: colors.shadow.menu,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function RoleplayPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'list' | 'emotion'>('list');
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [showAdvice, setShowAdvice] = useState(false);

  // 戻るボタンの処理
  const handleBack = () => {
    router.push('/app');
  };

  // ログアウト処理
  const handleLogout = async () => {
    await logout();
  };

  // ローディング中（認証）
  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  // ログインしていない場合
  if (!user) {
    router.push('/');
    return null;
  }

  // シナリオ一覧画面
  if (step === 'list') {
    return (
      <div style={commonStyles.page.container}>
        <HamburgerMenu>
          <MenuItem onClick={handleBack}>ホームに戻る</MenuItem>
          <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
        </HamburgerMenu>

        <div style={commonStyles.page.mainContent}>
          <div style={{ transform: 'scale(1.3)' }}>
            <SpeechBubble text="シナリオをえらんでね" />
          </div>

          <div style={{ marginBottom: spacing.xxl }}>
            <KokoronDefault size={200} />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xl,
              width: '100%',
              maxWidth: '390px',
            }}
          >
            {SCENARIOS.map((s, i) => (
              <button
                key={i}
                onClick={() => i === 0 && setStep('emotion')}
                disabled={i !== 0}
                style={{
                  width: '100%',
                  maxWidth: '390px',
                  minHeight: '90px',
                  fontSize: fontSize.xl,
                  fontWeight: '700',
                  borderRadius: borderRadius.large,
                  background: s.color,
                  color: colors.text.white,
                  border: 'none',
                  boxShadow: colors.shadow.light,
                  padding: spacing.lg,
                  opacity: i === 0 ? 1 : 0.7,
                  whiteSpace: 'pre-line',
                }}
              >
                {s.title}
                {i !== 0 && (
                  <span
                    style={{ fontSize: fontSize.large, marginLeft: spacing.sm }}
                  >
                    🔒
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 感情選択画面
  if (step === 'emotion') {
    const scenario = SCENARIOS[0];
    return (
      <div style={commonStyles.page.container}>
        <HamburgerMenu>
          <MenuItem onClick={handleBack}>ホームに戻る</MenuItem>
          <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
        </HamburgerMenu>

        {/* ← もどる */}
        <p
          onClick={() => {
            setStep('list');
            setSelectedEmotion(null);
            setShowAdvice(false);
          }}
          style={{
            position: 'fixed',
            top: spacing.xl,
            left: spacing.xl,
            fontSize: fontSize.large,
            color: colors.text.primary,
            cursor: 'pointer',
            fontWeight: 'bold',
            zIndex: 200,
          }}
        >
          ← もどる
        </p>

        {/* 中央にまとめるラッパー */}
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.xl,
            width: '100%',
            maxWidth: '390px',
            zIndex: 100,
          }}
        >
          {/* シナリオカード */}
          <div
            style={{
              background: colors.background.light,
              borderRadius: borderRadius.button,
              padding: spacing.xl,
              boxShadow: colors.shadow.menu,
              textAlign: 'center',
              width: '90%',
            }}
          >
            <p
              style={{
                fontSize: fontSize.xxl,
                marginBottom: spacing.lg,
                color: colors.text.secondary,
              }}
            >
              {scenario.description}
            </p>
            <img
              src="/images/roleplay.webp"
              style={{ width: '100%', maxWidth: '240px', height: 'auto' }}
            />
          </div>

          {/* 感情カード */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2,1fr)',
              gap: spacing.lg,
              width: '100%',
            }}
          >
            {DEFAULT_EMOTIONS.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEmotion(e)}
                style={{
                  background: colors.background.white,
                  border: `3px solid ${e.color}`,
                  borderRadius: borderRadius.large,
                  padding: spacing.md,
                  textAlign: 'center',
                  boxShadow: colors.shadow.light,
                }}
              >
                <img src={e.image_url} alt={e.label} width={60} />
                <p style={{ fontWeight: 'bold', marginTop: spacing.sm }}>
                  {e.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* モーダル */}
        <RoleplayModal
          open={!!selectedEmotion}
          onClose={() => {
            setSelectedEmotion(null);
            setShowAdvice(false);
          }}
        >
          {selectedEmotion && (
            <div style={{ textAlign: 'center', width: '100%' }}>
              {/* 右上の×ボタン */}
              <button
                onClick={() => {
                  setSelectedEmotion(null);
                  setShowAdvice(false);
                }}
                style={{
                  position: 'absolute',
                  top: spacing.sm,
                  right: spacing.sm,
                  background: 'transparent',
                  border: 'none',
                  fontSize: fontSize.xl,
                  fontWeight: 'bold',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                }}
                aria-label="閉じる"
              >
                ×
              </button>

              <h2>えらんだきもち</h2>

              <div
                style={{
                  display: 'inline-block',
                  background: colors.background.white,
                  border: `3px solid ${selectedEmotion.color}`,
                  borderRadius: borderRadius.large,
                  padding: spacing.md,
                  boxShadow: colors.shadow.menu,
                }}
              >
                <img
                  src={selectedEmotion.image_url}
                  alt={selectedEmotion.label}
                  width={80}
                />
                <p
                  style={{
                    fontWeight: 'bold',
                    color: selectedEmotion.color,
                    marginTop: spacing.sm,
                  }}
                >
                  {selectedEmotion.label}
                </p>
              </div>

              {/* 共通の声かけ */}
              <p
                style={{
                  marginTop: spacing.lg,
                  fontSize: fontSize.xl,
                  whiteSpace: 'pre-line',
                }}
              >
                {`そうだね。${getEmotionPhrase(selectedEmotion)}なんだね。
じゃあ、なかよく あそぶには
どうしたらいいかな？
ぱぱやままと いっしょに
かんがえてみよう！`}
              </p>

              {/* トグルボタン */}
              <button
                onClick={() => setShowAdvice((prev) => !prev)}
                style={{
                  marginTop: spacing.lg,
                  padding: `${spacing.xl} ${spacing.xl}`,
                  fontSize: fontSize.xl,
                  border: 'none',
                  borderRadius: borderRadius.button,
                  backgroundColor: colors.primary,
                  color: colors.text.white,
                  cursor: 'pointer',
                }}
              >
                {showAdvice ? 'とじる' : '🪄こころんのおまじない'}
              </button>

              {/* 吹き出し */}
              {showAdvice && (
                <div
                  style={{
                    marginTop: spacing.lg,
                    background: colors.background.light,
                    padding: `${spacing.md} ${spacing.lg}`,
                    borderRadius: borderRadius.button,
                    maxWidth: '260px',
                    fontSize: fontSize.large,
                    boxShadow: colors.shadow.light,
                    margin: '0 auto',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {selectedEmotion.id === 'kanashii' &&
                    '「かなしいよ」って いってみよう'}
                  {selectedEmotion.id === 'komatta' &&
                    '「どうしたらいい？」って\nきいてみよう'}
                  {selectedEmotion.id === 'fuyukai' &&
                    '「いやだな」って いってみよう'}
                  {selectedEmotion.id === 'ikari' &&
                    'いきを「すーっ」「はーっ」と\nゆっくりしてみよう'}
                </div>
              )}

              {/* こころん（中央下） */}
              <div
                style={{
                  marginTop: spacing.lg,
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <KokoronDefault size={120} />
              </div>
            </div>
          )}
        </RoleplayModal>
      </div>
    );
  }

  return null;
}
