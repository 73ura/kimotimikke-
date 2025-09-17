// 感情名を英語のファイル名にマッピング
export const EMOTION_NAME_TO_FILENAME: Record<string, string> = {
  うれしい: 'ureshii',
  ゆかい: 'yukai',
  あんしん: 'anshin',
  びっくり: 'bikkuri',
  こわい: 'kowai',
  かなしい: 'kanashii',
  こまった: 'komatta',
  ふゆかい: 'fuyukai',
  いかり: 'ikari',
  はずかしい: 'hazukashii',
  きんちょう: 'kinchou',
  わからない: 'wakaranai',
};

// 強度レベル定義
export const INTENSITY_LEVELS = [
  { id: 3, level: 'high', description: 'とても' },
  { id: 2, level: 'medium', description: '' },
  { id: 1, level: 'low', description: '少し' },
] as const;

// API エンドポイント
export const API_ENDPOINTS = {
  EMOTION_CARDS: 'http://localhost:8000/emotion/cards',
  EMOTION_INTENSITIES: 'http://localhost:8000/emotion/intensities',
  EMOTION_CHILDREN: 'http://localhost:8000/emotion/children',
  EMOTION_LOGS: 'http://localhost:8000/emotion/logs',
} as const;

// スワイプの閾値
export const SWIPE_THRESHOLD = 100;

// アニメーション時間
export const ANIMATION_DURATION = 1000;

// デフォルトの感情データ（API呼び出しに失敗した場合のフォールバック）
export const DEFAULT_EMOTIONS = [
  // 黄色の感情
  {
    id: 'ureshii',
    label: 'うれしい',
    color: '#FFD700',
    image_url: '/images/emotions/ureshii.webp',
  },
  {
    id: 'yukai',
    label: 'ゆかい',
    color: '#FFD700',
    image_url: '/images/emotions/yukai.webp',
  },

  // 緑色の感情
  {
    id: 'anshin',
    label: 'あんしん',
    color: '#00D4AA',
    image_url: '/images/emotions/anshin.webp',
  },
  {
    id: 'bikkuri',
    label: 'びっくり',
    color: '#00D4AA',
    image_url: '/images/emotions/bikkuri.webp',
  },

  // 青色の感情
  {
    id: 'kowai',
    label: 'こわい',
    color: '#0066FF',
    image_url: '/images/emotions/kowai.webp',
  },
  {
    id: 'kanashii',
    label: 'かなしい',
    color: '#0066FF',
    image_url: '/images/emotions/kanashii.webp',
  },
  {
    id: 'komatta',
    label: 'こまった',
    color: '#0066FF',
    image_url: '/images/emotions/komatta.webp',
  },

  // 赤色の感情
  {
    id: 'fuyukai',
    label: 'ふゆかい',
    color: '#FF1744',
    image_url: '/images/emotions/fuyukai.webp',
  },
  {
    id: 'ikari',
    label: 'いかり',
    color: '#FF1744',
    image_url: '/images/emotions/ikari.webp',
  },
  {
    id: 'hazukashii',
    label: 'はずかしい',
    color: '#FF1744',
    image_url: '/images/emotions/hazukashii.webp',
  },
  {
    id: 'kinchou',
    label: 'きんちょう',
    color: '#FF1744',
    image_url: '/images/emotions/kinchou.webp',
  },

  // 灰色の感情
  {
    id: 'wakaranai',
    label: 'わからない',
    color: '#424242',
    image_url: '/images/emotions/wakaranai.webp',
  },
];
