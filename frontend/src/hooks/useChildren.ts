import { useAuth } from '@/contexts/AuthContext';
import { getChildren } from '@/lib/api';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const fetchChildren = async () => {
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
        setError(
          err instanceof Error ? err.message : 'Failed to fetch children',
        );
        // エラー時も空の配列を設定
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [firebaseUser]);

  return { children, loading, error };
};
