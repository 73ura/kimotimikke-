import { useAuth } from '@/contexts/AuthContext';
import { getChildren } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

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

export interface Child {
  id: string;
  nickname: string;
  birth_date: string;
  gender: string;
  created_at: string;
  updated_at: string;
}

export const useChildren = () => {
  const { firebaseUser } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    if (!firebaseUser) {
      // Firebase認証が利用できない場合は、空の配列を設定してローディングを終了
      setChildren([]);
      // 少し遅延させてローディングスピナーを表示
      setTimeout(() => setLoading(false), 100);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const childrenData = await getChildren(firebaseUser);
      setChildren(childrenData);
    } catch (err) {
      console.error('Failed to fetch children:', err);

      // Firebase quota exceeded の場合は特別処理
      if (isFirebaseError(err) && err.code === 'auth/quota-exceeded') {
        console.warn('Firebase quota exceeded - 空の配列を返します');
        setChildren([]);
        setError(
          'Firebase quota exceeded - しばらく待ってから再試行してください',
        );
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch children',
        );
        setChildren([]);
      }
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchChildren();
  }, [firebaseUser, fetchChildren]);

  return { children, loading, error, refetch: fetchChildren };
};
