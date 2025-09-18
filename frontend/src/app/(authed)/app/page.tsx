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
import { useEffect } from 'react';

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
  const { children, loading: childrenLoading } = useChildren();
  const router = useRouter();

  // サブスク未登録の場合のチェック（すべてのローディング完了後に判定）
  const needsSubscription =
    subLoading || childrenLoading || todayEntryLoading
      ? false
      : !has_subscription || status === 'incomplete';

  // childrenのニックネームがあるかどうかで判定
  // Firebase quota exceeded の場合はセットアップをスキップ
  // ローディング中はセットアップ不要と判定
  const needsSetup =
    !needsSubscription && !childrenLoading && children.length === 0;

  // デバッグ用（一時的）
  if (process.env.NODE_ENV === 'development') {
    console.log('=== リダイレクト判定デバッグ ===');
    console.log('has_subscription:', has_subscription);
    console.log('status:', status);
    console.log('needsSubscription:', needsSubscription);
    console.log('children.length:', children.length);
    console.log('needsSetup:', needsSetup);
    console.log('subLoading:', subLoading);
    console.log('childrenLoading:', childrenLoading);
    console.log('todayEntryLoading:', todayEntryLoading);
    console.log('==============================');
  }

  useEffect(() => {
    // ローディング中はリダイレクトしない
    if (subLoading || childrenLoading || todayEntryLoading) {
      return;
    }

    if (needsSubscription) {
      console.log('リダイレクト実行: /pricing (needsSubscription=true)');
      router.push('/pricing');
    } else if (needsSetup) {
      console.log('リダイレクト実行: /app/setup (needsSetup=true)');
      router.push('/app/setup');
    }
  }, [
    needsSubscription,
    needsSetup,
    subLoading,
    childrenLoading,
    todayEntryLoading,
    router,
  ]);

  // おしゃべりボタンが押された時の処理
  const handleStartEmotion = () => {
    router.push('/app/emotion-selection');
  };

  const handleViewTodayEntry = () => {
    router.push('/app/entries/today');
  };

  // ローディング中
  if (subLoading || childrenLoading || todayEntryLoading) {
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
