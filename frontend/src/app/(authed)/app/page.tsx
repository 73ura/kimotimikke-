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
  const { todayEntry } = useTodayEntry();
  const { children, loading: childrenLoading } = useChildren();
  const router = useRouter();

  // サブスク未登録の場合のチェック
  const needsSubscription = !has_subscription || status === 'incomplete';

  // childrenのニックネームがあるかどうかで判定
  const needsSetup = !needsSubscription && children.length === 0;

  useEffect(() => {
    // ローディング中は処理をスキップ
    if (subLoading || childrenLoading) {
      console.log('ローディング中: 処理をスキップ');
      return;
    }

    console.log('=== useEffect デバッグ ===');
    console.log('needsSubscription:', needsSubscription);
    console.log('needsSetup:', needsSetup);
    console.log('has_subscription:', has_subscription);
    console.log('status:', status);
    console.log('children count:', children.length);
    console.log('========================');

    if (needsSubscription) {
      console.log('リダイレクト: /subscription');
      router.push('/subscription');
    } else if (needsSetup) {
      console.log('リダイレクト: /app/setup');
      router.push('/app/setup');
    }
  }, [
    needsSubscription,
    needsSetup,
    router,
    has_subscription,
    status,
    subLoading,
    childrenLoading,
    children.length,
  ]); // childrenLoadingとchildren.lengthも追加

  // おしゃべりボタンが押された時の処理
  const handleStartEmotion = () => {
    router.push('/app/emotion-selection');
  };

  const handleViewTodayEntry = () => {
    router.push('/app/entries/today');
  };

  // ローディング中
  if (subLoading || childrenLoading) {
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

  // デバッグ情報を表示（一時的に）
  console.log('=== デバッグ情報 ===');
  console.log('has_subscription:', has_subscription);
  console.log('status:', status);
  console.log('trial:', is_trial);
  console.log('trial_expires_at:', trial_expires_at);
  console.log('loading:', subLoading);
  console.log('error:', error);
  console.log('========================');

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
