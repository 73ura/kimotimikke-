// 認証関連の型定義
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserResponse } from './api';

export interface AuthError {
  code: string;
  message: string;
  userFriendlyMessage: string;
  retryable: boolean;
}

export interface AuthState {
  user: UserResponse | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: AuthError | null;
}

// Firebase認証エラーコードの定義
export const AUTH_ERROR_CODES = {
  // ネットワーク関連
  NETWORK_ERROR: 'auth/network-request-failed',
  TIMEOUT: 'auth/timeout',

  // 認証関連
  INVALID_CREDENTIAL: 'auth/invalid-credential',
  USER_DISABLED: 'auth/user-disabled',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  WEAK_PASSWORD: 'auth/weak-password',
  INVALID_EMAIL: 'auth/invalid-email',

  // ポップアップ関連
  POPUP_CLOSED_BY_USER: 'auth/popup-closed-by-user',
  POPUP_BLOCKED: 'auth/popup-blocked',

  // トークン関連
  TOKEN_EXPIRED: 'auth/user-token-expired',
  INVALID_TOKEN: 'auth/invalid-user-token',

  // その他
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  REQUIRES_RECENT_LOGIN: 'auth/requires-recent-login',

  // バックエンド関連
  BACKEND_LOGIN_FAILED: 'auth/backend-login-failed',
} as const;

// エラーメッセージのマッピング
export const AUTH_ERROR_MESSAGES: Record<string, AuthError> = {
  [AUTH_ERROR_CODES.NETWORK_ERROR]: {
    code: AUTH_ERROR_CODES.NETWORK_ERROR,
    message: 'ネットワークエラーが発生しました',
    userFriendlyMessage: 'インターネット接続を確認して、もう一度お試しください',
    retryable: true,
  },
  [AUTH_ERROR_CODES.TIMEOUT]: {
    code: AUTH_ERROR_CODES.TIMEOUT,
    message: '認証処理がタイムアウトしました',
    userFriendlyMessage: '処理に時間がかかっています。もう一度お試しください',
    retryable: true,
  },
  [AUTH_ERROR_CODES.INVALID_CREDENTIAL]: {
    code: AUTH_ERROR_CODES.INVALID_CREDENTIAL,
    message: '認証情報が無効です',
    userFriendlyMessage: 'ログイン情報を確認して、もう一度お試しください',
    retryable: false,
  },
  [AUTH_ERROR_CODES.USER_DISABLED]: {
    code: AUTH_ERROR_CODES.USER_DISABLED,
    message: 'このアカウントは無効化されています',
    userFriendlyMessage:
      'アカウントが無効化されています。サポートにお問い合わせください',
    retryable: false,
  },
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: {
    code: AUTH_ERROR_CODES.USER_NOT_FOUND,
    message: 'ユーザーが見つかりません',
    userFriendlyMessage: 'アカウントが見つかりません。新規登録をお試しください',
    retryable: false,
  },
  [AUTH_ERROR_CODES.WRONG_PASSWORD]: {
    code: AUTH_ERROR_CODES.WRONG_PASSWORD,
    message: 'パスワードが間違っています',
    userFriendlyMessage: 'パスワードが正しくありません。もう一度お試しください',
    retryable: false,
  },
  [AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE]: {
    code: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE,
    message: 'このメールアドレスは既に使用されています',
    userFriendlyMessage:
      'このメールアドレスは既に登録されています。ログインをお試しください',
    retryable: false,
  },
  [AUTH_ERROR_CODES.WEAK_PASSWORD]: {
    code: AUTH_ERROR_CODES.WEAK_PASSWORD,
    message: 'パスワードが弱すぎます',
    userFriendlyMessage: 'より強力なパスワードを設定してください',
    retryable: false,
  },
  [AUTH_ERROR_CODES.INVALID_EMAIL]: {
    code: AUTH_ERROR_CODES.INVALID_EMAIL,
    message: 'メールアドレスの形式が無効です',
    userFriendlyMessage: '正しいメールアドレスを入力してください',
    retryable: false,
  },
  [AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER]: {
    code: AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER,
    message: 'ログインポップアップが閉じられました',
    userFriendlyMessage:
      'ログインを完了するには、ポップアップを閉じずに操作を続けてください',
    retryable: true,
  },
  [AUTH_ERROR_CODES.POPUP_BLOCKED]: {
    code: AUTH_ERROR_CODES.POPUP_BLOCKED,
    message: 'ポップアップがブロックされました',
    userFriendlyMessage:
      'ブラウザのポップアップブロックを無効にして、もう一度お試しください',
    retryable: true,
  },
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: {
    code: AUTH_ERROR_CODES.TOKEN_EXPIRED,
    message: '認証トークンの有効期限が切れています',
    userFriendlyMessage:
      'セッションの有効期限が切れました。再度ログインしてください',
    retryable: true,
  },
  [AUTH_ERROR_CODES.INVALID_TOKEN]: {
    code: AUTH_ERROR_CODES.INVALID_TOKEN,
    message: '認証トークンが無効です',
    userFriendlyMessage: '認証情報に問題があります。再度ログインしてください',
    retryable: true,
  },
  [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]: {
    code: AUTH_ERROR_CODES.TOO_MANY_REQUESTS,
    message: 'リクエストが多すぎます',
    userFriendlyMessage: 'しばらく時間をおいてから、もう一度お試しください',
    retryable: true,
  },
  [AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED]: {
    code: AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED,
    message: 'この操作は許可されていません',
    userFriendlyMessage:
      'この操作は現在利用できません。サポートにお問い合わせください',
    retryable: false,
  },
  [AUTH_ERROR_CODES.REQUIRES_RECENT_LOGIN]: {
    code: AUTH_ERROR_CODES.REQUIRES_RECENT_LOGIN,
    message: '最近のログインが必要です',
    userFriendlyMessage: 'セキュリティのため、再度ログインしてください',
    retryable: true,
  },
  [AUTH_ERROR_CODES.BACKEND_LOGIN_FAILED]: {
    code: AUTH_ERROR_CODES.BACKEND_LOGIN_FAILED,
    message: 'バックエンドのログインに失敗しました',
    userFriendlyMessage:
      'サーバーとの通信に問題が発生しました。時間をおいて再度お試しください',
    retryable: true,
  },
};

// デフォルトエラー
export const DEFAULT_AUTH_ERROR: AuthError = {
  code: 'auth/unknown-error',
  message: '不明なエラーが発生しました',
  userFriendlyMessage: '予期しないエラーが発生しました。もう一度お試しください',
  retryable: true,
};
