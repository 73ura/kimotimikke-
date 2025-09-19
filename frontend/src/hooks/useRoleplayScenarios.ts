import { useAuth } from '@/contexts/AuthContext';
import { getRoleplayScenario, getRoleplayScenarios } from '@/lib/api';
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

export interface RoleplayScenario {
  id: string;
  title: string;
  description?: string;
  color: string;
  scenario_content: string;
  image_url?: string;
  emotion_types: string[];
  keywords: string[];
  age_range_min: number;
  age_range_max: number;
  difficulty_level: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RoleplayScenariosResponse {
  scenarios: RoleplayScenario[];
  total: number;
  limit: number;
  offset: number;
}

export const useRoleplayScenarios = (
  childAge?: number,
  difficultyLevel?: number,
  limit: number = 50,
  offset: number = 0,
) => {
  const { firebaseUser } = useAuth();
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      if (!firebaseUser) {
        setScenarios([]);
        setTotal(0);
        setTimeout(() => setLoading(false), 100);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response: RoleplayScenariosResponse = await getRoleplayScenarios(
          firebaseUser,
          childAge,
          difficultyLevel,
          limit,
          offset,
        );
        setScenarios(response.scenarios);
        setTotal(response.total);
      } catch (err) {
        console.error('Failed to fetch roleplay scenarios:', err);

        if (isFirebaseError(err) && err.code === 'auth/quota-exceeded') {
          console.warn('Firebase quota exceeded - 空の配列を返します');
          setScenarios([]);
          setTotal(0);
          setError(
            'Firebase quota exceeded - しばらく待ってから再試行してください',
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to fetch roleplay scenarios',
          );
          setScenarios([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, [firebaseUser, childAge, difficultyLevel, limit, offset]);

  return { scenarios, total, loading, error };
};

export const useRoleplayScenario = (scenarioId: string) => {
  const { firebaseUser } = useAuth();
  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenario = async () => {
      if (!firebaseUser || !scenarioId) {
        setScenario(null);
        setTimeout(() => setLoading(false), 100);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getRoleplayScenario(scenarioId, firebaseUser);
        setScenario(response);
      } catch (err) {
        console.error('Failed to fetch roleplay scenario:', err);

        if (isFirebaseError(err) && err.code === 'auth/quota-exceeded') {
          console.warn('Firebase quota exceeded - nullを返します');
          setScenario(null);
          setError(
            'Firebase quota exceeded - しばらく待ってから再試行してください',
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to fetch roleplay scenario',
          );
          setScenario(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchScenario();
  }, [firebaseUser, scenarioId]);

  return { scenario, loading, error };
};
