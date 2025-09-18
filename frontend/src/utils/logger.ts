/**
 * ログ出力ユーティリティ
 * 開発環境では詳細ログを出力、本番環境ではユーザー向けメッセージ + 内部ログを出力
 */

const isDev = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * デバッグログ（開発環境のみ）
 */
export const log = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

/**
 * 警告ログ（開発環境のみ）
 */
export const warn = (...args: any[]) => {
  if (isDev) {
    console.warn(...args);
  }
};

/**
 * エラーログ（本番環境でも出力）
 */
export const error = (...args: any[]) => {
  console.error(...args);
};

/**
 * 情報ログ（開発環境のみ）
 */
export const info = (...args: any[]) => {
  if (isDev) {
    console.info(...args);
  }
};

/**
 * デバッグログ（条件付き）
 */
export const debug = (condition: boolean, ...args: any[]) => {
  if (condition && isDev) {
    console.log(...args);
  }
};

/**
 * パフォーマンス測定ログ（開発環境のみ）
 */
export const time = (label: string) => {
  if (isDev) {
    console.time(label);
  }
};

export const timeEnd = (label: string) => {
  if (isDev) {
    console.timeEnd(label);
  }
};

/**
 * グループログ（開発環境のみ）
 */
export const group = (label: string) => {
  if (isDev) {
    console.group(label);
  }
};

export const groupEnd = () => {
  if (isDev) {
    console.groupEnd();
  }
};

/**
 * テーブルログ（開発環境のみ）
 */
export const table = (data: any) => {
  if (isDev) {
    console.table(data);
  }
};

/**
 * 認証エラー専用ログ（環境別出力）
 */
export const logAuthError = (authError: any, context: string = 'Auth') => {
  if (isDev) {
    // 開発環境: 詳細なデバッグ情報を出力
    console.group(`🔐 [${context}] 認証エラー詳細`);
    console.error('エラーコード:', authError.code);
    console.error('技術的メッセージ:', authError.message);
    console.error('ユーザー向けメッセージ:', authError.userFriendlyMessage);
    console.error('再試行可能:', authError.retryable);
    console.error('タイムスタンプ:', new Date().toISOString());
    if (authError.debugInfo) {
      console.error('デバッグ情報:', authError.debugInfo);
    }
    console.groupEnd();
  } else {
    // 本番環境: ユーザー向けメッセージ + 内部ログ
    console.error(`[${context}] 認証エラー:`, {
      code: authError.code,
      userFriendlyMessage: authError.userFriendlyMessage,
      timestamp: new Date().toISOString(),
      // 本番環境でも必要な技術情報は含める
      message: authError.message,
      retryable: authError.retryable,
    });
  }
};

/**
 * 本番環境用の内部ログ（ユーザーには表示されない）
 */
export const internalLog = (...args: any[]) => {
  if (isProduction) {
    console.log('[INTERNAL]', ...args);
  }
};

/**
 * 本番環境用の内部エラーログ（ユーザーには表示されない）
 */
export const internalError = (...args: any[]) => {
  if (isProduction) {
    console.error('[INTERNAL ERROR]', ...args);
  }
};
