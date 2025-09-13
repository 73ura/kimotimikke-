/**
 * ログ出力ユーティリティ
 * 本番環境ではデバッグログを抑制し、エラーログのみ出力
 */

const isDev = process.env.NODE_ENV !== 'production';

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
