'use client';

import { auth as firebaseAuth } from '@/lib/firebase';
import type { UserResponse } from '@/types/api';
import type { AuthError } from '@/types/auth';
import { logAuthError, parseAuthError } from '@/utils/auth-error';
import { log, warn } from '@/utils/logger';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  user: UserResponse | null; // バックエンドユーザー
  firebaseUser: FirebaseUser | null; // Firebaseユーザー
  isLoading: boolean;
  error: AuthError | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<string | null>;
  checkSession: () => Promise<boolean>;
  // XSS攻撃対策用のメモリ永続化機能
  getSecureToken: () => Promise<string | null>;
  clearSecureToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // XSS攻撃対策：メモリ内でのトークン管理
  const [secureToken, setSecureToken] = useState<string | null>(null);
  const [tokenRefreshInterval, setTokenRefreshInterval] =
    useState<NodeJS.Timeout | null>(null);

  // 自動トークンリフレッシュの設定
  const setupTokenRefresh = useCallback(() => {
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }

    const interval = setInterval(
      async () => {
        if (!firebaseUser) return;

        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const expirationTime = tokenResult.expirationTime;
          const now = new Date();
          const tokenExpiry = new Date(expirationTime);

          // トークンが10分以内に期限切れになる場合はリフレッシュ
          const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

          if (tokenExpiry <= tenMinutesFromNow) {
            log('Auto-refreshing token...');
            const newToken = await firebaseUser.getIdToken(true);
            setSecureToken(newToken);

            // バックエンドのHttpOnly Cookieも更新
            await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/login`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: newToken }),
                credentials: 'include',
              },
            );
          }
        } catch (error) {
          warn('Auto token refresh failed:', error);
        }
      },
      5 * 60 * 1000,
    ); // 5分間隔でチェック

    setTokenRefreshInterval(interval);
  }, [firebaseUser, tokenRefreshInterval]);

  useEffect(() => {
    log('=== AuthContext useEffect started ===');

    // Firebase認証が利用できない場合（CI環境など）の処理
    if (!firebaseAuth) {
      log('Firebase auth not available, setting loading to false');
      // 少し遅延させてローディングスピナーを表示
      setTimeout(() => setIsLoading(false), 100);
      return;
    }

    // signInWithPopupを使用するため、リダイレクト結果の処理は不要

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (process.env.NODE_ENV === 'development') {
        log('=== onAuthStateChanged triggered ===');
        log(
          '1. Firebase user state changed:',
          fbUser ? 'User found' : 'No user',
        );
      }

      setFirebaseUser(fbUser);
      if (fbUser) {
        if (process.env.NODE_ENV === 'development') {
          log('2. Getting ID token');
        }
        const idToken = await fbUser.getIdToken();
        if (process.env.NODE_ENV === 'development') {
          log('3. ID token obtained, calling backend API');
        }

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_token: idToken }),
              credentials: 'include', // HttpOnly Cookieを受け取るため
            },
          );
          if (!res.ok) {
            const errorText = await res.text();
            const e = new Error(
              `Backend login failed: ${res.status} - ${errorText}`,
            ) as Error & { code: string };
            e.code = 'auth/backend-login-failed'; // 固有コード
            throw e;
          }
          const backendUser = await res.json();
          if (process.env.NODE_ENV === 'development') {
            log('4. Backend API call successful, setting user');
          }
          setUser(backendUser);
          setError(null); // 成功時はエラーをクリア

          // XSS攻撃対策：トークンをメモリに保存（HttpOnly Cookieはサーバー側で設定済み）
          setSecureToken(idToken);

          // 自動リフレッシュの設定
          setupTokenRefresh();
        } catch (error) {
          const authError = parseAuthError(error);
          logAuthError(authError, 'Backend Login');
          setUser(null);
          setError(authError);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          log('2. No Firebase user, clearing backend user');
        }
        setUser(null);
      }
      if (process.env.NODE_ENV === 'development') {
        log('5. Setting isLoading to false');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []); // setupTokenRefreshを依存配列から削除して無限ループを防ぐ

  // 定期的なセッションチェック（5分間隔）
  useEffect(() => {
    if (!firebaseUser) return;

    const interval = setInterval(
      async () => {
        // トークンの有効期限をチェック
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const expirationTime = tokenResult.expirationTime;
          const now = new Date();
          const tokenExpiry = new Date(expirationTime);

          // トークンが5分以内に期限切れになる場合はリフレッシュ
          const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

          if (tokenExpiry <= fiveMinutesFromNow) {
            if (process.env.NODE_ENV === 'development') {
              log('Token expires soon, refreshing...');
            }
            await firebaseUser.getIdToken(true); // 強制リフレッシュ
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            warn('Session check failed:', error);
          }
        }
      },
      5 * 60 * 1000,
    ); // 5分間隔

    return () => clearInterval(interval);
  }, [firebaseUser, setupTokenRefresh]);

  const login = async () => {
    if (process.env.NODE_ENV === 'development') {
      log('=== AuthContext login() called ===');
    }

    // Firebase認証が利用できない場合の処理
    if (!firebaseAuth) {
      const authError = parseAuthError(
        new Error('認証サービスが利用できません'),
      );
      logAuthError(authError, 'Login');
      setError(authError);
      throw authError;
    }

    // エラーをクリア
    setError(null);

    try {
      if (process.env.NODE_ENV === 'development') {
        log('1. Creating GoogleAuthProvider');
      }
      const provider = new GoogleAuthProvider();

      if (process.env.NODE_ENV === 'development') {
        log('2. Calling signInWithPopup');
      }
      await signInWithPopup(firebaseAuth, provider);
      if (process.env.NODE_ENV === 'development') {
        log('3. signInWithPopup completed successfully');
      }

      // 認証成功後、/pricingにリダイレクト
      if (process.env.NODE_ENV === 'development') {
        log('4. Redirecting to /pricing');
      }
      setTimeout(() => {
        window.location.href = '/pricing';
      }, 500);
    } catch (error) {
      const authError = parseAuthError(error);
      logAuthError(authError, 'Google Login');
      setError(authError);
      throw authError;
    }
  };

  const logout = async () => {
    try {
      // Firebase認証が利用できない場合の処理
      if (!firebaseAuth) {
        log('Firebase auth not available, clearing local state only');
        setUser(null);
        setFirebaseUser(null);
        setError(null);
        clearSecureToken();
        return;
      }

      // バックエンドのHttpOnly Cookieを削除
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        warn('Backend logout failed:', error);
      }

      // Firebaseからサインアウト
      await signOut(firebaseAuth);

      // ローカル状態をクリア
      setUser(null);
      setFirebaseUser(null);
      setError(null);
      clearSecureToken();
    } catch (error) {
      const authError = parseAuthError(error);
      logAuthError(authError, 'Logout');
      setError(authError);
      throw authError;
    }
  };

  const clearError = () => {
    setError(null);
  };

  // トークンリフレッシュ機能
  const refreshToken = async (): Promise<string | null> => {
    if (!firebaseUser) {
      return null;
    }

    try {
      const newToken = await firebaseUser.getIdToken(true); // 強制リフレッシュ
      log('Token refreshed successfully');
      return newToken;
    } catch (error) {
      const authError = parseAuthError(error);
      logAuthError(authError, 'Token Refresh');
      setError(authError);
      return null;
    }
  };

  // セッション有効性チェック
  const checkSession = async (): Promise<boolean> => {
    if (!firebaseUser) {
      return false;
    }

    try {
      // トークンの有効期限をチェック
      const tokenResult = await firebaseUser.getIdTokenResult();
      const expirationTime = tokenResult.expirationTime;
      const now = new Date();
      const tokenExpiry = new Date(expirationTime);

      // トークンが5分以内に期限切れになる場合はリフレッシュ
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (tokenExpiry <= fiveMinutesFromNow) {
        log('Token expires soon, refreshing...');
        await refreshToken();
      }

      return true;
    } catch (error) {
      const authError = parseAuthError(error);
      logAuthError(authError, 'Session Check');
      setError(authError);
      return false;
    }
  };

  // XSS攻撃対策：メモリ内でのトークン取得
  const getSecureToken = async (): Promise<string | null> => {
    if (!firebaseUser) {
      return null;
    }

    try {
      // メモリ内のトークンが有効かチェック
      if (secureToken) {
        const tokenResult = await firebaseUser.getIdTokenResult();
        const expirationTime = tokenResult.expirationTime;
        const now = new Date();
        const tokenExpiry = new Date(expirationTime);

        // トークンがまだ有効な場合はメモリ内のトークンを返す
        if (tokenExpiry > now) {
          return secureToken;
        }
      }

      // 新しいトークンを取得してメモリに保存
      const newToken = await firebaseUser.getIdToken(true);
      setSecureToken(newToken);
      return newToken;
    } catch (error) {
      const authError = parseAuthError(error);
      logAuthError(authError, 'Secure Token Get');
      setError(authError);
      return null;
    }
  };

  // XSS攻撃対策：メモリ内のトークンをクリア
  const clearSecureToken = () => {
    setSecureToken(null);
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
      setTokenRefreshInterval(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        error,
        login,
        logout,
        clearError,
        refreshToken,
        checkSession,
        getSecureToken,
        clearSecureToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
