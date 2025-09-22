import { useAuth } from '@/contexts/AuthContext';
import {
  analyzeChildEmotions,
  getEmotionAnalysisSummary,
  type EmotionAnalysisResponse,
} from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

// キャッシュの型定義
interface CachedAnalysis {
  data: EmotionAnalysisResponse;
  timestamp: number;
  childId: string;
  days: number;
}

// キャッシュの有効期限（24時間）
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間

interface EmotionAnalysisSummary {
  analysis_period: string;
  children_analysis: Array<{
    child_id: string;
    child_name: string;
    total_records: number;
    top_emotion?: {
      emotion_id: string;
      emotion_label: string;
      count: number;
      percentage: number;
      color: string;
    };
    confidence_score: number;
    feedback_summary: string;
    error?: string;
  }>;
}

export const useEmotionAnalysis = (childId?: string, days: number = 30) => {
  const { firebaseUser } = useAuth();
  const [analysis, setAnalysis] = useState<EmotionAnalysisResponse | null>(
    null,
  );
  const [summary, setSummary] = useState<EmotionAnalysisSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // キャッシュから分析結果を取得
  const getCachedAnalysis = useCallback(
    (childId: string, days: number): EmotionAnalysisResponse | null => {
      try {
        const cacheKey = `emotion_analysis_${childId}_${days}`;
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;

        const cachedData: CachedAnalysis = JSON.parse(cached);
        const now = Date.now();

        // キャッシュが有効期限内かチェック
        if (now - cachedData.timestamp < CACHE_DURATION) {
          return cachedData.data;
        }

        // 期限切れのキャッシュを削除
        localStorage.removeItem(cacheKey);
        return null;
      } catch (error) {
        console.error('Failed to get cached analysis:', error);
        return null;
      }
    },
    [],
  );

  // 分析結果をキャッシュに保存
  const setCachedAnalysis = useCallback(
    (childId: string, days: number, data: EmotionAnalysisResponse) => {
      try {
        const cacheKey = `emotion_analysis_${childId}_${days}`;
        const cachedData: CachedAnalysis = {
          data,
          timestamp: Date.now(),
          childId,
          days,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      } catch (error) {
        console.error('Failed to cache analysis:', error);
      }
    },
    [],
  );

  const fetchChildAnalysis = useCallback(
    async (forceRefresh = false) => {
      if (!firebaseUser || !childId) return;

      // キャッシュをチェック（強制更新でない場合）
      if (!forceRefresh) {
        const cachedResult = getCachedAnalysis(childId, days);
        if (cachedResult) {
          setAnalysis(cachedResult);
          setLastUpdated(new Date());
          return;
        }
      }

      try {
        setLoading(true);
        setError(null);
        const result = await analyzeChildEmotions(childId, days, firebaseUser);
        setAnalysis(result);
        setLastUpdated(new Date());

        // 結果をキャッシュに保存
        setCachedAnalysis(childId, days, result);
      } catch (err) {
        console.error('Failed to fetch child emotion analysis:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch emotion analysis',
        );
      } finally {
        setLoading(false);
      }
    },
    [firebaseUser, childId, days, getCachedAnalysis, setCachedAnalysis],
  );

  const fetchSummary = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getEmotionAnalysisSummary(days, firebaseUser);
      setSummary(result);
    } catch (err) {
      console.error('Failed to fetch emotion analysis summary:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch analysis summary',
      );
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, days]);

  useEffect(() => {
    if (childId) {
      fetchChildAnalysis();
    }
    // childIdが指定されていない場合は何もしない
  }, [fetchChildAnalysis, childId]);

  // 強制更新用の関数
  const forceRefresh = useCallback(() => {
    if (childId) {
      fetchChildAnalysis(true);
    }
  }, [childId, fetchChildAnalysis]);

  return {
    analysis,
    summary,
    loading,
    error,
    lastUpdated,
    refetch: childId ? fetchChildAnalysis : fetchSummary,
    forceRefresh,
  };
};
