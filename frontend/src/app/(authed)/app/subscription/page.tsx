'use client';

import { HamburgerMenu, PrimaryButton, Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  borderRadius,
  colors,
  commonStyles,
  fontSize,
  spacing,
} from '@/styles/theme';

export default function SubscriptionManagePage() {
  const { user, firebaseUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const {
    has_subscription,
    status,
    is_trial,
    trial_expires_at,
    cancel_at_period_end,
    loading: subLoading,
    error,
    refetch,
  } = useSubscription();

  const [isCanceling, setIsCanceling] = useState(false);

  const handleBack = () => {
    router.push('/app');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // サブスクリプション解約処理
  const handleCancelSubscription = async () => {
    if (!firebaseUser) return;

    const confirmCancel = window.confirm(
      'サブスクリプションを解約しますか？\n解約後も現在の請求期間の終了まではサービスをご利用いただけます。',
    );

    if (!confirmCancel) return;

    setIsCanceling(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBaseUrl) {
        throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
      }

      const response = await fetch(
        `${apiBaseUrl}/api/v1/stripe/subscription/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('サブスクリプションの解約に失敗しました');
      }

      alert('サブスクリプションの解約手続きが完了しました。');
      refetch(); // サブスクリプション状態を再取得
    } catch (error) {
      console.error('Cancellation error:', error);
      alert(
        '解約処理中にエラーが発生しました。しばらく時間をおいて再度お試しください。',
      );
    } finally {
      setIsCanceling(false);
    }
  };

  // サブスクリプション再開処理
  const handleReactivateSubscription = () => {
    router.push('/subscription');
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 有料開始日フォーマット関数
  const formatPaidStartDate = (trialExpiresAt: string) => {
    const date = new Date(trialExpiresAt);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ローディング中
  if (authLoading || subLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  // 未認証の場合
  if (!user) {
    return null;
  }

  const getStatusDisplay = () => {
    if (!has_subscription) {
      return {
        status: 'サブスクリプション未登録',
        color: colors.text.secondary,
        description:
          'サブスクリプションに登録して、すべての機能をお楽しみください。',
      };
    }

    if (is_trial) {
      if (cancel_at_period_end) {
        return {
          status: '無料トライアル中（解約予定）',
          color: '#ff6b6b',
          description: `${trial_expires_at ? formatDate(trial_expires_at) : '不明'} にサービス終了予定です`,
        };
      } else {
        return {
          status: '無料トライアル中',
          color: '#28a745',
          description: `トライアル期間: ${trial_expires_at ? formatDate(trial_expires_at) : '不明'} まで`,
        };
      }
    }

    if (status === 'active') {
      return {
        status: 'サブスクリプション登録中',
        color: '#28a745',
        description: `${trial_expires_at ? formatPaidStartDate(trial_expires_at) : '不明'} より有料プランをご利用いただいております`,
      };
    }

    if (status === 'canceled') {
      return {
        status: '解約済み',
        color: '#dc3545',
        description: '現在の請求期間の終了まではサービスをご利用いただけます。',
      };
    }

    return {
      status: status || '不明',
      color: colors.text.secondary,
      description: 'サブスクリプション状態を確認中です。',
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div style={commonStyles.page.container}>
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />

      {/* 戻るボタン */}
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

      <div style={commonStyles.page.mainContent}>
        {/* タイトル */}
        <h1
          style={{
            fontSize: fontSize.xxl,
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '40px 0 20px 0',
            color: colors.text.primary,
          }}
        >
          サブスクリプション管理
        </h1>

        {/* サブスクリプション状態表示 */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: borderRadius.large,
            padding: spacing.xl,
            boxShadow: colors.shadow.medium,
            marginBottom: spacing.lg,
            maxWidth: '60vw',
            width: '60vw',
            overflow: 'auto',
          }}
        >
          <h2
            style={{
              fontSize: fontSize.xl,
              fontWeight: 'bold',
              marginBottom: spacing.md,
              color: colors.text.primary,
              textAlign: 'center',
            }}
          >
            現在のステータス
          </h2>

          <div
            style={{
              textAlign: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <div
              style={{
                fontSize: fontSize.large,
                fontWeight: 'bold',
                color: statusDisplay.color,
                marginBottom: spacing.sm,
              }}
            >
              {statusDisplay.status}
            </div>
            <div
              style={{
                fontSize: fontSize.base,
                color: colors.text.secondary,
                lineHeight: 1.5,
              }}
            >
              {statusDisplay.description}
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div
              style={{
                backgroundColor: '#ffe6e6',
                border: '1px solid #ffcccc',
                borderRadius: borderRadius.small,
                padding: spacing.md,
                marginBottom: spacing.md,
                color: '#d32f2f',
                fontSize: fontSize.small,
              }}
            >
              エラー: {error}
            </div>
          )}

          {/* アクション部分 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
              alignItems: 'center',
            }}
          >
            {!has_subscription ? (
              // サブスクリプション未登録の場合
              <PrimaryButton
                onClick={handleReactivateSubscription}
                style={{
                  fontSize: fontSize.large,
                  padding: `${spacing.md} ${spacing.xl}`,
                  minWidth: '200px',
                }}
              >
                サブスクリプションに登録
              </PrimaryButton>
            ) : status === 'canceled' ? (
              // 解約済みの場合
              <PrimaryButton
                onClick={handleReactivateSubscription}
                style={{
                  fontSize: fontSize.large,
                  padding: `${spacing.md} ${spacing.xl}`,
                  minWidth: '200px',
                }}
              >
                サブスクリプションを再開
              </PrimaryButton>
            ) : cancel_at_period_end ? (
              // 解約予定の場合
              <div
                style={{
                  textAlign: 'center',
                  padding: `${spacing.md} ${spacing.xl}`,
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: borderRadius.button,
                  minWidth: '200px',
                }}
              >
                <div
                  style={{
                    fontSize: fontSize.large,
                    fontWeight: 'bold',
                    color: '#856404',
                    marginBottom: spacing.xs,
                  }}
                >
                  解約手続き完了
                </div>
                <div
                  style={{
                    fontSize: fontSize.small,
                    color: '#856404',
                  }}
                >
                  {trial_expires_at ? formatDate(trial_expires_at) : '期間終了'}{' '}
                  にサービス終了
                </div>
              </div>
            ) : (
              // アクティブ・トライアル中の場合
              <button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                style={{
                  backgroundColor: isCanceling ? '#cccccc' : '#dc3545',
                  color: colors.background.white,
                  border: 'none',
                  borderRadius: borderRadius.button,
                  padding: `${spacing.md} ${spacing.xl}`,
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  cursor: isCanceling ? 'not-allowed' : 'pointer',
                  minWidth: '200px',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isCanceling) {
                    e.currentTarget.style.backgroundColor = '#c82333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCanceling) {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                  }
                }}
              >
                {isCanceling ? '解約中...' : 'サブスクリプションを解約'}
              </button>
            )}

            {/* 更新ボタン */}
            <button
              onClick={refetch}
              style={{
                backgroundColor: 'transparent',
                color: colors.text.secondary,
                border: `1px solid ${colors.text.secondary}`,
                borderRadius: borderRadius.button,
                padding: `${spacing.sm} ${spacing.md}`,
                fontSize: fontSize.base,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.text.secondary;
                e.currentTarget.style.color = colors.background.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
              }}
            >
              状態を更新
            </button>
          </div>
        </div>

        {/* 注意事項 */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: borderRadius.medium,
            padding: spacing.md,
            maxWidth: '500px',
            width: '100%',
            fontSize: fontSize.small,
            color: colors.text.secondary,
            lineHeight: 1.5,
          }}
        >
          <ul style={{ margin: 0, paddingLeft: spacing.md }}>
            <li>
              解約後も現在の請求期間終了まではサービスをご利用いただけます
            </li>
            <li>再登録はいつでも可能です</li>
            <li>データは解約後も保持されます</li>
          </ul>
          {/* 詳細ヘルプページへのリンク */}
          <div
            style={{
              textAlign: 'center',
              marginTop: spacing.lg,
            }}
          >
            <button
              onClick={() => router.push('/app/billing')}
              style={{
                backgroundColor: 'transparent',
                color: colors.primary,
                border: `1px solid ${colors.primary}`,
                borderRadius: borderRadius.button,
                padding: `${spacing.sm} ${spacing.md}`,
                fontSize: fontSize.base,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textDecoration: 'underline',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.color = colors.background.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.primary;
              }}
            >
              詳細な料金・解約情報を見る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
