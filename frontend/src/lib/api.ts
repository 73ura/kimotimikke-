//NOTE: ドメイン別関数をこちらでまとめる。
import { loadStripe } from '@stripe/stripe-js';
import { User } from 'firebase/auth';

// ===================
// Stripe決済検証関連API
// ===================
export const verifyPayment = async (sessionId: string, firebaseUser: User) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/stripe/session-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

// チェックアウトセッション作成関数
export const createCheckoutSession = async (idToken: string) => {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/stripe/checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(
        `Failed to create checkout session: ${msg || res.status}`,
      );
    }

    const data: { sessionId?: string } = await res.json();
    if (!data.sessionId) {
      throw new Error('Response does not include sessionId');
    }

    return data.sessionId;
  } catch (error) {
    console.error('Checkout session creation error:', error);
    throw error;
  }
};

// Stripeリダイレクト関数
export const redirectToStripeCheckout = async (sessionId: string) => {
  const stripe = await loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  );

  if (!stripe) {
    throw new Error('Stripe.js failed to initialize');
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    throw error;
  }
};

// サブスクリプション状態取得
export const getSubscriptionStatus = async () => {};

// ===================
// 子ども管理関連API
// ===================

export const createChild = async (
  childData: {
    nickname: string;
    birth_date: string; // YYYY-MM-DD形式
    gender: string;
  },
  firebaseUser: User,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(childData),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Create child error:', error);
    throw error;
  }
};

// ユーザーに紐づく子どものリスト取得
export const getChildren = async (firebaseUser: User) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/children`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get children error:', error);
    throw error;
  }
};

// 子供の数を取得
export const getChildrenCount = async (firebaseUser: User) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/children/count`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result.count;
  } catch (error) {
    console.error('Get children count error:', error);
    throw error;
  }
};

// ===================
// 感情記録関連API
// ===================
export const getEmotionLogs = async (
  firebaseUser: User,
  child_id?: string,
  limit: number = 100,
  offset: number = 0,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    let url = `${API_BASE_URL}/emotion/logs/list?limit=${limit}&offset=${offset}`;
    if (child_id) {
      url += `&child_id=${child_id}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get emotion logs error:', error);
    throw error;
  }
};

// 指定日の感情ログ取得
export const getEmotionLogsByDate = async (
  firebaseUser: User,
  date: string,
  child_id?: string,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    let url = `${API_BASE_URL}/emotion/logs/daily/${date}`;
    if (child_id) {
      url += `?child_id=${child_id}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get emotion logs by date error:', error);
    throw error;
  }
};

// 指定月の感情ログ取得
export const getEmotionLogsByMonth = async (
  firebaseUser: User,
  year: number,
  month: number,
  child_id?: string,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    let url = `${API_BASE_URL}/emotion/logs/monthly/${year}/${month}`;
    if (child_id) {
      url += `?child_id=${child_id}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get emotion logs by month error:', error);
    throw error;
  }
};

// 感情カード一覧取得
export const getEmotionCards = async (firebaseUser: User) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(`${API_BASE_URL}/emotion/cards`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get emotion cards error:', error);
    throw error;
  }
};

// 子どものプロフィール更新
export const updateChildProfile = async (
  childId: string,
  childData: {
    nickname: string;
    birth_date: string; // YYYY-MM-DD形式
    gender: string;
  },
  firebaseUser: User,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/children/${childId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(childData),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Update child profile error:', error);
    throw error;
  }
};

// 子どものプロフィール削除
export const deleteChildProfile = async (
  childId: string,
  firebaseUser: User,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/children/${childId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Delete child profile error:', error);
    throw error;
  }
};

// 強度一覧取得
export const getIntensities = async (firebaseUser: User) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(`${API_BASE_URL}/emotion/intensities`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get intensities error:', error);
    throw error;
  }
};

// ===================
// ロールプレイ関連API
// ===================

// ロールプレイシナリオ一覧取得
export const getRoleplayScenarios = async (
  firebaseUser: User,
  childAge?: number,
  difficultyLevel?: number,
  limit: number = 50,
  offset: number = 0,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    let url = `${API_BASE_URL}/api/v1/roleplay/scenarios?limit=${limit}&offset=${offset}`;
    if (childAge) {
      url += `&child_age=${childAge}`;
    }
    if (difficultyLevel) {
      url += `&difficulty_level=${difficultyLevel}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get roleplay scenarios error:', error);
    throw error;
  }
};

// ロールプレイシナリオ詳細取得
export const getRoleplayScenario = async (
  scenarioId: string,
  firebaseUser: User,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/roleplay/scenarios/${scenarioId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get roleplay scenario error:', error);
    throw error;
  }
};

// ロールプレイアドバイス取得
export const getRoleplayAdvice = async (
  scenarioId: string,
  emotionId: string,
  firebaseUser: User,
) => {
  try {
    console.log('=== getRoleplayAdvice API呼び出し ===');
    console.log('scenarioId:', scenarioId);
    console.log('emotionId:', emotionId);

    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const url = `${API_BASE_URL}/api/v1/roleplay/advice?scenario_id=${scenarioId}&emotion_id=${emotionId}`;
    console.log('API URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    console.log('API Response:', result);
    return result;
  } catch (error) {
    console.error('Get roleplay advice error:', error);
    throw error;
  }
};

// ロールプレイセッション作成
export const createRoleplaySession = async (
  sessionData: {
    child_id: string;
    scenario_id: string;
    emotion_log_id?: string;
    selected_emotion_id?: string;
  },
  firebaseUser: User,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/roleplay/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Create roleplay session error:', error);
    throw error;
  }
};

// ロールプレイセッション更新
export const updateRoleplaySession = async (
  sessionId: string,
  updateData: {
    session_duration?: number;
    completion_status?: 'started' | 'completed' | 'abandoned';
    user_rating?: number;
    user_feedback?: string;
  },
  firebaseUser: User,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/roleplay/sessions/${sessionId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Update roleplay session error:', error);
    throw error;
  }
};

// ロールプレイセッション一覧取得
export const getRoleplaySessions = async (
  firebaseUser: User,
  childId?: string,
  limit: number = 50,
  offset: number = 0,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    let url = `${API_BASE_URL}/api/v1/roleplay/sessions?limit=${limit}&offset=${offset}`;
    if (childId) {
      url += `&child_id=${childId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get roleplay sessions error:', error);
    throw error;
  }
};

// ロールプレイセッション詳細取得
export const getRoleplaySession = async (
  sessionId: string,
  firebaseUser: User,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/roleplay/sessions/${sessionId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get roleplay session error:', error);
    throw error;
  }
};

// ===================
// 感情パターン分析API
// ===================

// 感情分析結果の型定義
export interface EmotionFrequency {
  emotion_id: string;
  emotion_label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface IntensityDistribution {
  intensity_id: number;
  count: number;
  percentage: number;
}

export interface WeeklyPattern {
  day_of_week: number;
  emotion_counts: Record<string, number>;
}

export interface EmotionTrend {
  emotion_id: string;
  emotion_label: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  change_percentage: number;
}

export interface ParentFeedback {
  summary: string;
  insights: string[];
  recommendations: string[];
  positive_aspects: string[];
  areas_for_attention: string[];
}

export interface DayOfWeekPattern {
  day_of_week: string;
  emotion_frequencies: EmotionFrequency[];
  total_records: number;
  avg_intensity: number;
  dominant_emotion: string;
  dominant_emotion_percentage: number;
}

export interface VoiceTextAnalysis {
  keyword_frequency: {
    top_keywords: Array<{
      word: string;
      count: number;
      percentage: number;
    }>;
    total_words: number;
    unique_words: number;
  };
  topics: {
    top_topics: Array<{
      topic: string;
      count: number;
      percentage: number;
    }>;
    total_categories: number;
  };
  language_features: {
    total_characters: number;
    total_sentences: number;
    total_words: number;
    unique_words: number;
    avg_sentence_length: number;
    avg_words_per_sentence: number;
    vocabulary_richness: number;
    emotion_density: number;
    avg_voice_note_length: number;
  };
  total_voice_notes: number;
  analysis_period: string;
}

export interface EmotionAnalysisResponse {
  child_id: string;
  child_name: string;
  analysis_period: string;
  total_records: number;
  emotion_frequencies: EmotionFrequency[];
  intensity_distribution: IntensityDistribution[];
  weekly_patterns: WeeklyPattern[];
  emotion_trends: EmotionTrend[];
  feedback: ParentFeedback;
  voice_analysis: VoiceTextAnalysis | null;
  day_of_week_patterns: DayOfWeekPattern[];
  analysis_date: string;
  confidence_score: number;
}

// 子供の感情パターン分析
export const analyzeChildEmotions = async (
  childId: string,
  days: number = 30,
  firebaseUser: User,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/emotion-analysis/child/${childId}?days=${days}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result as EmotionAnalysisResponse;
  } catch (error) {
    console.error('Analyze child emotions error:', error);
    throw error;
  }
};

// 感情分析サマリー取得
export const getEmotionAnalysisSummary = async (
  days: number = 30,
  firebaseUser: User,
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/emotion-analysis/summary?days=${days}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get emotion analysis summary error:', error);
    throw error;
  }
};
