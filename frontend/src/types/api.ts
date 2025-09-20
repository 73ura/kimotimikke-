export type UserResponse = {
  id: string;
  uid: string;
  email: string;
  nickname: string | null;
  email_verified: boolean;
  role: string;
  created_at: string;
  updated_at: string;
};

// 感情カードのマスタデータ型
export type EmotionCard = {
  id: string;
  label: string; // "うれしい", "かなしい" など
  image_url: string;
  color: string;
};

// 感情の強度のマスタデータ型
export type Intensity = {
  id: string;
  color_modifier: string;
};

// 感情レポート1件分のデータ型。daily_reportのモーダル表示で使用
export type EmotionLog = {
  id: string;
  child_id: string;
  created_at: string;
  voice_note?: string | null;
  audio_path?: string | null;
  emotion_card: EmotionCard;
  intensity: Intensity;
};

// DailyReportコンポーネントのデータ型。マンスリーカレンダー表示で使用
export type DailyReportMonthlyData = {
  logs: {
    [date: string]: EmotionLog;
  };
};

// WeeklyReportコンポーネントのデータ型。
export type WeeklyReportData = {
  id: string;
  week_start_date: string;
  week_end_date: string;
  trend_summary: string;
  advice_for_child: string;
  growth_points: string;
  daily_logs_in_week: EmotionLog[];
};

// ロールプレイシナリオのデータ型
export type RoleplayScenario = {
  id: string;
  title: string;
  description: string | null;
  color: string;
  scenario_content: string;
  image_url: string | null;
  emotion_types: string[];
  keywords: string[];
  age_range_min: number;
  age_range_max: number;
  difficulty_level: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// ロールプレイアドバイスのデータ型
export type RoleplayAdvice = {
  id: string;
  scenario_id: string;
  emotion_id: string;
  advice_text: string;
  advice_type: string;
  created_at: string;
  updated_at: string;
};

// ロールプレイセッションのデータ型
export type RoleplaySession = {
  id: string;
  user_id: string;
  child_id: string;
  scenario_id: string;
  selected_emotion_id: string | null;
  session_duration: number | null;
  completion_status: 'started' | 'completed' | 'abandoned';
  user_rating: number | null;
  user_feedback: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};
