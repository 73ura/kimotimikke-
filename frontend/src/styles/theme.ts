/**
 * プロジェクト全体のデザインシステム
 * 色、サイズ、アニメーション、共通スタイルを一元管理
 */

// ===== カラーパレット =====
// ブランドカラーとUI要素の色を定義
export const colors = {
  primary: '#ff6b6b', // メインカラー（ピンク系）
  primaryHover: '#ff5252', // ホバー時のメインカラー
  secondary: '#667eea', // サブカラー（青系）
  secondaryHover: '#764ba2', // ホバー時のサブカラー
  text: {
    primary: '#333', // メインテキスト色
    secondary: '#666', // サブテキスト色
    white: '#ffffff', // 白テキスト
    error: '#e74c3c', // エラーテキスト色
  },
  background: {
    white: '#ffffff', // 白背景
    transparent: 'transparent', // 透明背景
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // グラデーション背景
    light: '#f8f9fa', // 薄い背景色
  },
  border: {
    light: 'rgba(255,255,255,0.5)', // 薄いボーダー
    dark: '#333', // 濃いボーダー
  },
  shadow: {
    light: '0 4px 8px rgba(0,0,0,0.1)', // 軽い影
    medium: '0 4px 12px rgba(255,107,107,0.3)', // 中程度の影
    heavy: '0 8px 32px rgba(0,0,0,0.1)', // 重い影
    menu: '0 4px 12px rgba(0,0,0,0.15)', // メニュー用の影
  },
  login: {
    primary: '#4285F4', // Googleログインボタン色
    hover: '#3367D6', // ホバー時のログインボタン色
  },
} as const;

// ===== 感情カラーシステム =====
// DBから取得したデータを処理するためのユーティリティ関数
export const emotionColorUtils = {
  // 強度による透明度（DB intensity テーブルの color_modifier カラム）
  // 注：実際の値はDBから取得するが、フォールバック用として定義
  intensityModifiers: {
    1: 0.4, // 薄い
    2: 0.7, // 中間
    3: 1.0, // 濃い
  },
} as const;

// ===== 感情カラーロジック関数 =====
interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * HEXカラーをRGBに変換
 * @param hex - HEXカラーコード（例: "#FF0000"）
 * @returns RGBオブジェクト または null（無効な形式の場合）
 */
export function hexToRgb(hex: string): RgbColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * 感情の基本色と強度から最終的な色を計算
 * @param baseColor - 基本色（HEXコード）
 * @param intensity - 強度（1-3）
 * @param intensityModifiers - 強度による透明度マップ（DBから取得）
 * @returns RGBA形式の色文字列
 */
export function getEmotionColor(
  baseColor: string,
  intensity: number,
  intensityModifiers: Record<
    number,
    number
  > = emotionColorUtils.intensityModifiers,
): string {
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    console.error('Invalid color format:', baseColor);
    return 'rgba(128, 128, 128, 0.5)'; // フォールバック色
  }

  const opacity = intensityModifiers[intensity] || 0.5;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * 感情データと強度から最終的な色を計算
 * @param emotionData - DBから取得した感情データ
 * @param intensity - 強度（1-3）
 * @param intensityModifiers - 強度による透明度マップ（DBから取得）
 * @returns RGBA形式の色文字列
 */
export function getEmotionColorFromData(
  emotionData: { color: string },
  intensity: number,
  intensityModifiers: Record<
    number,
    number
  > = emotionColorUtils.intensityModifiers,
): string {
  return getEmotionColor(emotionData.color, intensity, intensityModifiers);
}

/**
 * 強度選択が必要かどうかを判定
 * @param emotionData - DBから取得した感情データ
 * @returns 強度選択が必要な場合はtrue
 */
export function isIntensityRequired(emotionData: {
  is_intensity_required?: boolean;
}): boolean {
  return emotionData.is_intensity_required !== false;
}

// ===== サイズとスペーシング =====
// レイアウトの間隔を統一管理
export const spacing = {
  xs: '2px', // 最小間隔（4px → 2px）
  sm: '4px', // 小間隔（8px → 4px）
  md: '8px', // 中間隔（16px → 8px）
  lg: '12px', // 大間隔（24px → 12px）
  xl: '16px', // 特大間隔（32px → 16px）
  xxl: '24px', // 最大間隔（48px → 24px）
} as const;

// ===== ボーダーラジウス =====
// 角丸のサイズを統一管理
export const borderRadius = {
  small: '4px', // 小角丸（8px → 4px）
  medium: '8px', // 中角丸（16px → 8px）
  large: '12px', // 大角丸（20px → 12px）
  button: '16px', // ボタン用角丸（24px → 16px）
  circle: '50%', // 円形
} as const;

// ===== フォントサイズ =====
// テキストサイズを統一管理（390px幅に適応）
export const fontSize = {
  small: '12px', // 最小サイズ（14px → 12px）
  base: '14px', // 基本サイズ（16px → 14px）
  large: '16px', // 大文字（18px → 16px）
  xl: '18px', // 特大文字（20px → 18px）
  xxl: '20px', // 最大文字（24px → 20px）
} as const;

// ===== アニメーション =====
// トランジションとアニメーションを定義
export const animation = {
  spin: 'spin 1s linear infinite', // 回転アニメーション（スピナー用）
  transition: 'all 0.3s ease', // 標準トランジション
  transitionFast: 'all 0.2s ease', // 高速トランジション
} as const;

// ===== 共通スタイル =====
// よく使うスタイルを事前定義
export const commonStyles = {
  // レイアウト用スタイル
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  fullHeight: {
    minHeight: '100vh',
  },

  // ページ全体のレイアウト
  page: {
    container: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundImage: 'url("/images/background.webp")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      overflow: 'hidden',
    },
    mainContent: {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    kokoronContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: `${spacing.lg} 0`,
    },
  },

  // ハンバーガーメニュー関連
  menuButton: {
    position: 'fixed' as const,
    top: spacing.md,
    right: spacing.md,
    width: '50px',
    height: '50px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: borderRadius.small,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 200,
  },
  menuIcon: {
    width: '32px',
    height: '4px',
    background: colors.text.primary,
    borderRadius: '2px',
  },
  menuDrawer: {
    position: 'fixed' as const,
    top: 0,
    right: '-300px',
    width: '300px',
    height: '100vh',
    background: colors.background.white,
    boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
    transition: animation.transition,
    zIndex: 1000,
  },
  menuDrawerOpen: {
    right: 0,
  },
  menuOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },

  // ログイン画面関連
  login: {
    container: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'url("/images/background.webp") no-repeat center center',
      backgroundSize: 'cover',
      padding: spacing.md,
      zIndex: 300,
    },
    card: {
      background: colors.background.white,
      borderRadius: borderRadius.large,
      padding: spacing.lg,
      textAlign: 'center' as const,
      boxShadow: colors.shadow.heavy,
      maxWidth: '300px',
      width: '100%',
    },
    button: {
      background: colors.login.primary,
      border: 'none',
      borderRadius: '25px',
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: fontSize.base,
      fontWeight: 'bold',
      color: colors.text.white,
      cursor: 'pointer',
      transition: animation.transition,
    },
  },

  // ローディング画面関連
  loading: {
    container: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url("/images/background.webp")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      zIndex: 300,
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTop: `4px solid ${colors.primary}`,
      borderRadius: borderRadius.circle,
      animation: animation.spin,
      marginBottom: spacing.md,
    },
  },

  // ボタンスタイル
  button: {
    base: {
      border: 'none',
      cursor: 'pointer',
      transition: animation.transition,
      fontFamily: 'inherit',
    },
    primary: {
      backgroundColor: colors.primary,
      color: colors.text.white,
      borderRadius: borderRadius.button,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: fontSize.base,
      fontWeight: 'bold',
      minWidth: '120px',
      boxShadow: colors.shadow.medium,
    },
    secondary: {
      backgroundColor: colors.background.transparent,
      border: `1px solid ${colors.border.light}`,
      color: colors.text.primary,
      borderRadius: borderRadius.small,
      padding: `${spacing.xs} ${spacing.sm}`,
      fontSize: fontSize.small,
    },
  },

  // カードスタイル
  card: {
    background: colors.background.white,
    borderRadius: borderRadius.medium,
    boxShadow: colors.shadow.heavy,
    padding: spacing.xl,
  },

  // ドロップダウンメニュー関連
  menu: {
    background: colors.background.white,
    borderRadius: borderRadius.small,
    boxShadow: colors.shadow.menu,
    padding: `${spacing.sm} 0`,
    minWidth: '100px',
  },
  menuItem: {
    width: '100%',
    padding: `${spacing.md} ${spacing.md}`,
    background: 'none',
    border: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: fontSize.base,
    color: colors.text.primary,
    transition: animation.transitionFast,
  },

  // 汎用スピナー（ロード中のぐるぐる）
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: `4px solid ${colors.primary}`,
    borderRadius: borderRadius.circle,
    animation: animation.spin,
  },
} as const;

// ===== レスポンシブ対応 =====
// デバイス別のブレークポイント
export const breakpoints = {
  mobile: '480px', // スマートフォン
  tablet: '768px', // タブレット
  desktop: '1024px', // デスクトップ
} as const;

// メディアクエリの定義
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
} as const;
