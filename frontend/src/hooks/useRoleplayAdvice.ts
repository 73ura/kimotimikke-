import { useAuth } from '@/contexts/AuthContext';
import { getRoleplayAdvice } from '@/lib/api';
import { useEffect, useState } from 'react';

interface FirebaseError {
  code: string;
  message: string;
}

function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

export interface RoleplayAdvice {
  id: string;
  scenario_id: string;
  emotion_id: string;
  advice_text: string;
  advice_type: string;
  created_at: string;
  updated_at: string;
}

export const useRoleplayAdvice = (scenarioId: string, emotionId: string) => {
  const { firebaseUser } = useAuth();
  const [advice, setAdvice] = useState<RoleplayAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdvice = async () => {
      if (!firebaseUser || !scenarioId || !emotionId) {
        setAdvice(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getRoleplayAdvice(
          scenarioId,
          emotionId,
          firebaseUser,
        );
        setAdvice(response);
      } catch (err) {
        console.error('Failed to fetch roleplay advice:', err);

        if (isFirebaseError(err) && err.code === 'auth/quota-exceeded') {
          console.warn('Firebase quota exceeded - nullを返します');
          setAdvice(null);
          setError(
            'Firebase quota exceeded - しばらく待ってから再試行してください',
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to fetch roleplay advice',
          );
          setAdvice(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, [firebaseUser, scenarioId, emotionId]);

  return { advice, loading, error };
};
