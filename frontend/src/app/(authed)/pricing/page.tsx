// ペイウォール
'use client';

import { KokoronDefault, PrimaryButton, Spinner } from '@/components/ui';
import { FeatureList } from '@/components/ui/FeatureList';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckoutSession, redirectToStripeCheckout } from '@/lib/api';
import { colors, commonStyles, fontSize, spacing } from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PricingPage() {
  const { firebaseUser, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // デバッグ用: 認証状態を確認
  console.log('=== PricingPage Debug ===');
  console.log('firebaseUser:', firebaseUser);
  console.log(
    'Current URL:',
    typeof window !== 'undefined' ? window.location.href : 'Server side',
  );

  const logDebugInfo = async () => {
    console.log('PricingPage render:', { firebaseUser: !!firebaseUser });

    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken(true); // 強制更新
        console.log('Firebase ID Token:', idToken);
        console.log('Token length:', idToken.length);
        console.log('Token preview:', idToken.substring(0, 50) + '...');
      } catch (error) {
        console.error('Failed to get ID token:', error);
      }
    } else {
      console.log('No Firebase user found');
    }
  };

  // コンポーネントがマウントされた時にデバッグ情報を出力
  useEffect(() => {
    logDebugInfo();
  }, [firebaseUser]);

  const handleStartSubscription = async () => {
    if (!firebaseUser) {
      alert('ログインしてください。');
      window.location.replace('/login');
      return;
    }

    setIsLoading(true);

    try {
      // 1) Firebaseの最新IDトークンを取得（リトライ機能付き）
      let idToken: string;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log(
            `Attempting to get ID token (attempt ${retryCount + 1}/${maxRetries})`,
          );
          idToken = await firebaseUser.getIdToken(true);
          console.log('ID token obtained successfully');
          break;
        } catch (tokenError: unknown) {
          console.error(
            `ID token error (attempt ${retryCount + 1}):`,
            tokenError,
          );
          retryCount++;

          if (retryCount >= maxRetries) {
            const errorMessage =
              tokenError instanceof Error
                ? tokenError.message
                : 'Unknown error';
            throw new Error(
              `Firebase認証トークンの取得に失敗しました。しばらく時間をおいて再度お試しください。\n詳細: ${errorMessage}`,
            );
          }

          // 少し待ってからリトライ
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount),
          );
        }
      }

      console.log(
        'Starting subscription with token:',
        idToken!.substring(0, 50) + '...',
      );

      // 2) Checkout Session 作成
      const sessionId = await createCheckoutSession(idToken!);

      // 3) Stripe.jsでリダイレクト
      await redirectToStripeCheckout(sessionId);
    } catch (err) {
      console.error('Subscription error:', err);
      alert('決済ページの作成に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    console.log('戻るボタンがクリックされました');
    console.log(
      '現在のパス:',
      typeof window !== 'undefined' ? window.location.pathname : 'Server side',
    );

    try {
      // ログアウト処理を実行
      await logout();
      console.log('ログアウト完了');

      // ログインページにリダイレクト
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        ...commonStyles.page.container,
      }}
    >
      <div style={commonStyles.page.mainContent}>
        {/* 戻るボタン */}
        <button
          onClick={handleBackToLogin}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: colors.text.secondary,
          }}
        >
          ← 戻る
        </button>

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
        </div>

        {/* 料金プランカード */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            textAlign: 'center',
            maxWidth: '80vw',
            width: '80vw',
            margin: `${spacing.lg} 0`,
            border: `3px solid ${colors.primary}`,
          }}
        >
          <h1
            style={{
              color: colors.text.primary,
              fontSize: fontSize.xxl,
              fontWeight: 'bold',
              marginBottom: spacing.sm,
            }}
          >
            <span style={{ color: colors.primary }}>STEP2</span>{' '}
            サブスクリプション登録
          </h1>

          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: colors.primary,
              marginBottom: spacing.xs,
            }}
          >
            300円
            <span
              style={{
                fontSize: fontSize.base,
                color: colors.text.secondary,
                fontWeight: 'normal',
              }}
            >
              /月
            </span>
          </div>

          <p
            style={{
              color: colors.text.secondary,
              fontSize: fontSize.small,
              marginBottom: spacing.lg,
            }}
          >
            8日目から有料プランへ移行します。
          </p>

          {/* 機能一覧 */}
          <FeatureList />

          <PrimaryButton onClick={handleStartSubscription} disabled={isLoading}>
            {isLoading ? '処理中...' : '7日間無料で始める'}
          </PrimaryButton>

          <p
            style={{
              fontSize: fontSize.small,
              color: colors.text.secondary,
              marginTop: spacing.md,
              lineHeight: 1.4,
            }}
          >
            無料期間中はいつでもキャンセル可能です。
            <br />
            キャンセルした場合、料金は一切発生しません。
          </p>
        </div>

        {/* FAQ リンク */}
        <button
          onClick={() => router.push('/help/billing')}
          style={{
            background: 'none',
            border: 'none',
            color: colors.primary,
            fontSize: fontSize.small,
            cursor: 'pointer',
            textDecoration: 'underline',
            marginTop: spacing.md,
          }}
        >
          料金・解約について詳しく見る
        </button>
      </div>
    </div>
  );
}
