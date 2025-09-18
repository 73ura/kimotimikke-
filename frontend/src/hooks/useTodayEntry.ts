'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface TodayEntry {
  id: string;
  date: string;
  emotion: string;
  intensity: number;
  audioUrl?: string;
  transcript?: string;
  createdAt: string;
}

interface VoiceRecord {
  id: string;
  created_at: string;
  emotion_card?: {
    label: string;
  };
  intensity_id?: number;
  voice_note?: string;
}

interface VoiceRecordsResponse {
  success: boolean;
  records: VoiceRecord[];
  total_count: number;
}

export function useTodayEntry() {
  const { user } = useAuth();
  const [todayEntry, setTodayEntry] = useState<TodayEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTodayEntry(null);
      setIsLoading(false);
      return;
    }

    const fetchTodayEntry = async () => {
      try {
        // 実際のAPIから今日の記録を取得
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/voice/records/${user.id}`,
        );

        if (response.ok) {
          const data: VoiceRecordsResponse = await response.json();

          // 今日の日付を取得（UTC基準で統一）
          const now = new Date();
          const today = now.toISOString().split('T')[0]; // UTC基準の今日の日付

          // 今日の記録を探す（シンプルな文字列比較）
          const todayRecord = data.records.find((record: VoiceRecord) => {
            if (!record.created_at) return false;

            // 文字列の場合のみ処理
            if (typeof record.created_at === 'string') {
              const recordDate = record.created_at.split('T')[0];
              return recordDate === today;
            }

            return false;
          });

          if (todayRecord) {
            setTodayEntry({
              id: todayRecord.id,
              date: today,
              emotion: todayRecord.emotion_card?.label || '不明',
              intensity: todayRecord.intensity_id || 1,
              transcript: todayRecord.voice_note || '',
              createdAt: todayRecord.created_at,
            });
          } else {
            setTodayEntry(null);
          }
        } else {
          console.error('[useTodayEntry] API呼び出し失敗:', response.status);
          setTodayEntry(null);
        }
      } catch (error) {
        setTodayEntry(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayEntry();
  }, [user]); // userが変更された時のみ再実行

  return { todayEntry, isLoading };
}
