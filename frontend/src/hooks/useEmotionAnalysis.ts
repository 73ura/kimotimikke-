import { useAuth } from '@/contexts/AuthContext';
import {
  analyzeChildEmotions,
  getEmotionAnalysisSummary,
  type EmotionAnalysisResponse,
} from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

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

  const fetchChildAnalysis = useCallback(async () => {
    if (!firebaseUser || !childId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyzeChildEmotions(childId, days, firebaseUser);
      setAnalysis(result);
    } catch (err) {
      console.error('Failed to fetch child emotion analysis:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch emotion analysis',
      );
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, childId, days]);

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
    } else {
      fetchSummary();
    }
  }, [fetchChildAnalysis, fetchSummary, childId]);

  return {
    analysis,
    summary,
    loading,
    error,
    refetch: childId ? fetchChildAnalysis : fetchSummary,
  };
};
