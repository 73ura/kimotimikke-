import { analyzeWithGemini, GeminiAnalysisResult } from '@/lib/api';
import { User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';

interface UseGeminiAnalysisReturn {
  analysis: GeminiAnalysisResult | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refetch: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

export const useGeminiAnalysis = (
  childId?: string,
  days: number = 30,
  firebaseUser?: User | null,
): UseGeminiAnalysisReturn => {
  const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!childId || !firebaseUser) {
      setAnalysis(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeWithGemini(childId, firebaseUser, days);
      setAnalysis(result);
      setLastUpdated(new Date().toLocaleString('ja-JP'));
    } catch (err) {
      console.error('Gemini AI分析エラー:', err);
      setError(err instanceof Error ? err.message : '分析に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [childId, days, firebaseUser]);

  const refetch = useCallback(async () => {
    await fetchAnalysis();
  }, [fetchAnalysis]);

  const forceRefresh = useCallback(async () => {
    setAnalysis(null);
    setLastUpdated(null);
    await fetchAnalysis();
  }, [fetchAnalysis]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return {
    analysis,
    loading,
    error,
    lastUpdated,
    refetch,
    forceRefresh,
  };
};
