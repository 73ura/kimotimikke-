'use client';

import { Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  borderRadius,
  colors,
  commonStyles,
  fontSize,
  spacing,
} from '@/styles/theme';
import { log, error as logError } from '@/utils/logger';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const { isLoading, error, login, logout, clearError } = useAuth();
  const router = useRouter();
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // ログインしていない場合の通常のレンダリング
  const handleLogin = async () => {
    log('=== Login Process Start ===');
    log('1. handleLogin called');

    setIsLoginLoading(true);
    clearError(); // エラーをクリア

    try {
      log('2. Calling login() function');
      await login();
      log('3. login() completed successfully');

      log('4. Redirecting to /subscription');
      router.push('/subscription');
      log('5. router.push completed');
    } catch (loginError) {
      logError('ログインエラー:', loginError);
      // AuthContextでエラーが設定されるため、ここでは追加の処理は不要
    } finally {
      setIsLoginLoading(false);
      log('6. Login process finished');
    }
  };

  const handleBackToHome = async () => {
    try {
      await logout();
      log('ログアウト完了');
      router.push('/');
    } catch (logoutError) {
      logError('ログアウトエラー:', logoutError);
      // AuthContextでエラーが設定されるため、ここでは追加の処理は不要
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
        backgroundImage: 'url(/images/background.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
      }}
    >
      <div style={commonStyles.page.mainContent}>
        {/* 戻るボタン */}
        <button
          onClick={handleBackToHome}
          style={{
            position: 'absolute',
            top: spacing.lg,
            left: spacing.lg,
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: colors.text.secondary,
          }}
        >
          ← 戻る
        </button>

        {/* ログインカード */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '20px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            textAlign: 'center',
            maxWidth: '90vw',
            width: '90vw',
            margin: `${spacing.lg} 0`,
            boxSizing: 'border-box',
          }}
        >
          <h1
            style={{
              color: colors.text.primary,
              fontSize: fontSize.xxl,
              fontWeight: 'bold',
              marginBottom: spacing.lg,
            }}
          >
            <span style={{ color: colors.primary }}>STEP1</span> ログイン
          </h1>

          <p
            style={{
              color: colors.text.secondary,
              fontSize: fontSize.large,
              marginBottom: spacing.xl,
              lineHeight: 1.6,
            }}
          >
            アプリをご利用いただくには、
            <br />
            Googleアカウントでログインが必要です。
          </p>

          {/* エラー表示 */}
          {error && (
            <div
              style={{
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: borderRadius.small,
                padding: spacing.md,
                marginBottom: spacing.md,
                color: '#c33',
                fontSize: fontSize.base,
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, marginBottom: spacing.sm }}>
                {error.userFriendlyMessage}
              </p>
              {/* 開発環境でのみ技術的詳細を表示 */}
              {process.env.NODE_ENV !== 'production' && (
                <details
                  style={{ marginTop: spacing.sm, fontSize: fontSize.small }}
                >
                  <summary style={{ cursor: 'pointer', color: '#666' }}>
                    技術的詳細（開発環境のみ）
                  </summary>
                  <div style={{ marginTop: spacing.xs, textAlign: 'left' }}>
                    <p>
                      <strong>エラーコード:</strong> {error.code}
                    </p>
                    <p>
                      <strong>技術的メッセージ:</strong> {error.message}
                    </p>
                    <p>
                      <strong>再試行可能:</strong>{' '}
                      {error.retryable ? 'はい' : 'いいえ'}
                    </p>
                  </div>
                </details>
              )}
              <button
                onClick={clearError}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c33',
                  fontSize: fontSize.small,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                エラーを閉じる
              </button>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoginLoading}
            style={{
              ...commonStyles.login.button,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              opacity: isLoginLoading ? 0.7 : 1,
              cursor: isLoginLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoginLoading ? (
              <>
                <Spinner size="small" color="#fff" />
                ログイン中...
              </>
            ) : (
              <>
                <span style={{ fontSize: '20px' }}>🔐</span>
                Googleでログイン
              </>
            )}
          </button>

          <div
            style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: '#f8f9fa',
              borderRadius: borderRadius.small,
              fontSize: fontSize.base,
              color: colors.text.secondary,
              lineHeight: 1.4,
              textAlign: 'left',
            }}
          >
            <p style={{ margin: 0 }}>
              ✅
              ログイン後、決済情報の入力をいただいた後に7日間の無料体験をご利用いただけるようになります。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
