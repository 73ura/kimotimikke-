// アプリ内トップページ
'use client';

import {
  HamburgerMenu,
  KokoronDefault,
  PrimaryButton,
  SpeechBubble,
  Spinner,
} from '@/components/ui';
import { useChildren } from '@/hooks/useChildren';
import { useSubscription } from '@/hooks/useSubscription';
import { useTodayEntry } from '@/hooks/useTodayEntry';
import { colors, commonStyles, fontSize, spacing } from '@/styles/theme';
import { useRouter } from 'next/navigation';

export default function AppHomePage() {
  const {
    has_subscription,
    status,
    is_trial,
    trial_expires_at,
    loading: subLoading,
    error,
  } = useSubscription();
  const { todayEntry, isLoading: todayEntryLoading } = useTodayEntry();
  const { children } = useChildren();
  const router = useRouter();

  // セットアップチェックはmiddlewareで実行されるため、ここでは不要

  // おしゃべりボタンが押された時の処理
  const handleStartEmotion = () => {
    router.push('/app/emotion-selection');
  };

  const handleViewTodayEntry = () => {
    router.push('/app/entries/today');
  };

  // ローディング中
  if (todayEntryLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  {
    /* メインコンテンツ */
  }
  const getSpeechBubbleText = () => {
    return `${children[0]?.nickname || ''}、\n\nきょうも いっしょに きもちを \n\nたんけんしよう！`;
  };

  return (
    <div style={commonStyles.page.container}>
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />
      <div style={commonStyles.page.mainContent}>
        <SpeechBubble text={getSpeechBubbleText()} />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={280} />
        </div>

        {/* メインアクション */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            alignItems: 'center',
            marginTop: spacing.xl,
          }}
        >
          {todayEntry ? (
            <>
              <PrimaryButton onClick={handleViewTodayEntry}>
                きょうのきろく
              </PrimaryButton>
              <button
                onClick={handleStartEmotion}
                style={{
                  background: 'none',
                  border: `2px solid ${colors.primary}`,
                  color: colors.primary,
                  borderRadius: '25px',
                  padding: `${spacing.sm} ${spacing.lg}`,
                  fontSize: fontSize.base,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                もういちどきろくする
              </button>
            </>
          ) : (
            <PrimaryButton onClick={handleStartEmotion}>
              きもちをきろくする
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
