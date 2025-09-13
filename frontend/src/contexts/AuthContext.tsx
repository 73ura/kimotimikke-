'use client';

import { auth as firebaseAuth } from '@/lib/firebase';
import type { UserResponse } from '@/types/api';
import type { AuthError } from '@/types/auth';
import {
  logAuthError,
  parseAuthError,
  retryAuthOperation,
} from '@/utils/auth-error';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    log('=== AuthContext useEffect started ===');

    // Firebase認証が利用できない場合（CI環境など）の処理
    if (!firebaseAuth) {
      log('Firebase auth not available, setting loading to false');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      log('=== onAuthStateChanged triggered ===');
      log('1. Firebase user state changed:', fbUser ? 'User found' : 'No user');

      setFirebaseUser(fbUser);
      if (fbUser) {
        log('2. Getting ID token');
        const idToken = await fbUser.getIdToken();
        log('3. ID token obtained, calling backend API');

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_token: idToken }),
              credentials: 'include', // Set-Cookieを受け取るため
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
          log('4. Backend API call successful, setting user');
          setUser(backendUser);
          setError(null); // 成功時はエラーをクリア
        } catch (error) {
          const authError = parseAuthError(error);
          logAuthError(authError, 'Backend Login');
          setUser(null);
          setError(authError);
        }
      } else {
        log('2. No Firebase user, clearing backend user');
        setUser(null);
      }
      log('5. Setting isLoading to false');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
            log('Token expires soon, refreshing...');
            await firebaseUser.getIdToken(true); // 強制リフレッシュ
          }
        } catch (error) {
          warn('Session check failed:', error);
        }
      },
      5 * 60 * 1000,
    ); // 5分間隔

    return () => clearInterval(interval);
  }, [firebaseUser]);

  const login = async () => {
    log('=== AuthContext login() called ===');

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
      log('1. Creating GoogleAuthProvider');
      const provider = new GoogleAuthProvider();

      // 再試行可能なログイン操作
      await retryAuthOperation(
        async () => {
          log('2. Calling signInWithPopup');
          if (!firebaseAuth) throw new Error('Firebase auth not available');
          await signInWithPopup(firebaseAuth, provider);
          log('3. signInWithPopup completed successfully');
        },
        2,
        1000,
      ); // 最大2回、1秒間隔で再試行
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
        return;
      }

      // Firebaseからサインアウトのみ実行
      // ローカル状態の更新は onAuthStateChanged に任せる
      await signOut(firebaseAuth);
      setError(null); // ログアウト成功時はエラーをクリア
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
        console.log('Token expires soon, refreshing...');
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
