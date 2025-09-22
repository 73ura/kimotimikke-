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

// 感情カードのUUIDから感情の文字列IDにマッピングする関数
const mapEmotionCardIdToEmotionString = (emotionCardId: string): string => {
  // 感情カードのUUIDから感情の文字列IDへのマッピング
  const emotionMapping: { [key: string]: string } = {
    '8129f110-dde8-48b4-adbd-4a0d18352020': 'anshin', // あんしん
    '373ed42c-d79c-4c83-b939-be37b7d3a18d': 'ikari', // いかり
    '0ea5e6c5-5375-4cec-8006-7be5276c304e': 'ureshii', // うれしい
    '2b87c2d6-5531-40ac-b348-aef455abfdf7': 'kanashii', // かなしい
    '697af88e-7571-44b2-bb60-0f92dd467bb6': 'kinchou', // きんちょう
    '9c1ab4fa-70fa-4037-853d-996fca665947': 'komatta', // こまった
    '4c77bea2-df44-464a-8e4a-4d3b2947cf7a': 'kowai', // こわい
    '71a81d78-722c-4ead-a31a-f9fa286bf227': 'hazukashii', // はずかしい
    'c170f0ef-950d-4a8d-a08e-7269b6d2479e': 'bikkuri', // びっくり
    'e48a80cd-948b-4745-b8cd-c44c1e8fed85': 'fuyukai', // ふゆかい
    '3edc24fb-bcd5-4d4b-8712-fec17f988713': 'yukai', // ゆかい
    '2e0f346b-8842-430d-9038-bc3349033f2e': 'wakaranai', // わからない
  };

  return emotionMapping[emotionCardId] || emotionCardId;
};

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

        // 感情カードのUUIDから感情の文字列IDに変換
        const emotionStringId = mapEmotionCardIdToEmotionString(emotionId);
        console.log('感情ID変換:', emotionId, '->', emotionStringId);

        const response = await getRoleplayAdvice(
          scenarioId,
          emotionStringId,
          firebaseUser,
        );
        // バックエンドは配列を返すので、最初の要素を取得
        setAdvice(Array.isArray(response) ? response[0] : response);
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
