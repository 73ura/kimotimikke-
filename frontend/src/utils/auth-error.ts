import {
  AUTH_ERROR_MESSAGES,
  AuthError,
  DEFAULT_AUTH_ERROR,
} from '@/types/auth';
import { logAuthError as loggerLogAuthError } from './logger';

/**
 * Firebase認証エラーを解析して適切なエラー情報を返す
 */
export function parseAuthError(error: unknown): AuthError {
  // Firebase認証エラーの場合
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    const errorCode = error.code.toLowerCase();

    // 既知のエラーコードの場合
    if (AUTH_ERROR_MESSAGES[errorCode]) {
      return AUTH_ERROR_MESSAGES[errorCode];
    }

    // Firebase認証エラーだが、マッピングされていない場合
    return {
      code: errorCode,
      message:
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : '認証エラーが発生しました',
      userFriendlyMessage:
        '認証処理でエラーが発生しました。もう一度お試しください',
      retryable: true,
    };
  }

  // ネットワークエラーの場合
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'TypeError' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.includes('fetch')
  ) {
    return AUTH_ERROR_MESSAGES['auth/network-request-failed'];
  }

  // タイムアウトエラーの場合
  if (
    (error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'AbortError') ||
    (error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('timeout'))
  ) {
    return AUTH_ERROR_MESSAGES['auth/timeout'];
  }

  // その他のエラー
  return {
    code: 'auth/unknown-error',
    message:
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : '不明なエラーが発生しました',
    userFriendlyMessage:
      '予期しないエラーが発生しました。もう一度お試しください',
    retryable: true,
  };
}

/**
 * エラーが再試行可能かどうかを判定
 */
export function isRetryableError(error: AuthError): boolean {
  return error.retryable;
}

/**
 * エラーログを出力（環境別）
 */
export function logAuthError(
  authError: AuthError,
  context: string = 'Auth',
): void {
  // logger.tsの環境別ログ関数を使用
  loggerLogAuthError(authError, context);
}

/**
 * エラー通知を表示
 */
export function showAuthError(error: AuthError): void {
  // NOTE:現在はalertを使用、将来的にはトースト通知に変更可能
  alert(error.userFriendlyMessage);
}

/**
 * 認証エラーの再試行ロジック
 */
export async function retryAuthOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: AuthError | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const authError = parseAuthError(error);
      lastError = authError;

      logAuthError(authError, `Retry attempt ${attempt}/${maxRetries}`);

      // 再試行不可能なエラーの場合
      if (!isRetryableError(authError)) {
        throw authError;
      }

      // 最後の試行の場合
      if (attempt === maxRetries) {
        throw authError;
      }

      // 次の試行まで待機
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError || DEFAULT_AUTH_ERROR;
}
