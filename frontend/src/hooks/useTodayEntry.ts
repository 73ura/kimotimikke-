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
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!apiBaseUrl) {
          throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
        }

        const response = await fetch(
          `${apiBaseUrl}/api/v1/voice/records/${user.id}`,
        );

        if (response.ok) {
          const data = await response.json();

          // 今日の日付を取得（JSTで）
          const now = new Date();
          const jstOffset = 9 * 60; // JSTはUTC+9
          const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
          const today = jstTime.toISOString().split('T')[0];

          console.log('[useTodayEntry] API応答:', data);
          console.log('[useTodayEntry] 今日の日付（JST）:', today);
          console.log(
            '[useTodayEntry] 現在時刻（JST）:',
            jstTime.toISOString(),
          );
          console.log('[useTodayEntry] レコード数:', data.records?.length || 0);

          // すべてのレコードのcreated_atを確認
          console.log('[DEBUG] 全レコードのcreated_at一覧:');
          data.records?.forEach((record: any, index: number) => {
            if (Array.isArray(record.created_at)) {
              // 配列形式の場合は中身も詳細表示
              const [dateStr, timeStr] = record.created_at;
              console.log(`[DEBUG] レコード${index}:`, {
                id: record.id,
                created_at: record.created_at,
                dateStr: dateStr,
                timeStr: timeStr,
                dateStrType: typeof dateStr,
                timeStrType: typeof timeStr,
                type: typeof record.created_at,
                isArray: Array.isArray(record.created_at),
                // 日付文字列の詳細分析
                year: dateStr ? dateStr.substring(0, 4) : 'N/A',
                month: dateStr ? dateStr.substring(4, 6) : 'N/A',
                day: dateStr ? dateStr.substring(6, 8) : 'N/A',
                formattedDate: dateStr
                  ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
                  : 'N/A',
                // 今日の日付との比較
                isToday: dateStr
                  ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}` ===
                    today
                  : false,
              });
            } else {
              console.log(`[DEBUG] レコード${index}:`, {
                id: record.id,
                created_at: record.created_at,
                type: typeof record.created_at,
                isArray: Array.isArray(record.created_at),
              });
            }
          });

          // 今日の記録を探す
          const todayRecord = data.records.find((record: any) => {
            try {
              // 日付の妥当性チェック
              if (!record.created_at) {
                console.log('[DEBUG] created_atがnull:', record.id);
                return false;
              }

              // 配列形式の場合（[日付, 時刻]）
              if (Array.isArray(record.created_at)) {
                const [dateStr, timeStr] = record.created_at;
                if (dateStr && typeof dateStr === 'string') {
                  // 日付文字列をUTC時刻として解析
                  const year = dateStr.substring(0, 4);
                  const month = dateStr.substring(4, 6);
                  const day = dateStr.substring(6, 8);
                  const hour = timeStr ? timeStr.substring(0, 2) : '00';
                  const minute = timeStr ? timeStr.substring(2, 4) : '00';
                  const second = timeStr ? timeStr.substring(4, 6) : '00';

                  // UTC時刻としてDateオブジェクトを作成
                  const utcDate = new Date(
                    `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
                  );

                  // JSTに変換（UTC+9）
                  const jstDate = new Date(
                    utcDate.getTime() + 9 * 60 * 60 * 1000,
                  );
                  const jstDateStr = jstDate.toISOString().split('T')[0];

                  const isMatch = jstDateStr === today;

                  console.log(`[DEBUG] 配列形式の日付比較（JST変換）:`, {
                    recordId: record.id,
                    original: dateStr,
                    timeStr: timeStr,
                    utcDate: utcDate.toISOString(),
                    jstDate: jstDateStr,
                    today: today,
                    isMatch: isMatch,
                  });

                  if (isMatch) {
                    console.log(
                      '[DEBUG] 今日の記録を発見（配列形式、JST変換後）:',
                      {
                        record: record,
                        original: dateStr,
                        jstDate: jstDateStr,
                        today: today,
                        timeStr: timeStr,
                      },
                    );
                  }

                  return isMatch;
                }
                console.log(
                  '[DEBUG] 配列の日付部分が無効:',
                  record.id,
                  record.created_at,
                );
                return false;
              }

              // 文字列の場合は直接比較
              if (typeof record.created_at === 'string') {
                const recordDateStr = record.created_at.split('T')[0];
                const isMatch = recordDateStr === today;

                console.log(`[DEBUG] 文字列形式の日付比較:`, {
                  recordId: record.id,
                  original: record.created_at,
                  recordDate: recordDateStr,
                  today: today,
                  isMatch: isMatch,
                });

                if (isMatch) {
                  console.log('[DEBUG] 今日の記録を発見（文字列形式）:', {
                    record: record,
                    recordDate: recordDateStr,
                    today: today,
                  });
                }

                return isMatch;
              }

              // 日付オブジェクトの場合
              const recordDate = new Date(record.created_at);

              // 日付が有効かチェック
              if (isNaN(recordDate.getTime())) {
                console.log(
                  '[DEBUG] 日付オブジェクトが無効:',
                  record.id,
                  record.created_at,
                );
                return false;
              }

              const recordDateStr = recordDate.toISOString().split('T')[0];
              const isMatch = recordDateStr === today;

              console.log(`[DEBUG] 日付オブジェクト形式の日付比較:`, {
                recordId: record.id,
                original: record.created_at,
                parsed: recordDateStr,
                today: today,
                isMatch: isMatch,
              });

              if (isMatch) {
                console.log(
                  '[DEBUG] 今日の記録を発見（日付オブジェクト形式）:',
                  {
                    record: record,
                    original: record.created_at,
                    parsed: recordDateStr,
                    today: today,
                  },
                );
              }

              return isMatch;
            } catch (error) {
              console.error('[useTodayEntry] 日付変換エラー:', error, record);
              return false;
            }
          });

          console.log('[useTodayEntry] 今日の記録:', todayRecord);

          if (todayRecord) {
            setTodayEntry({
              id: todayRecord.id,
              date: today,
              emotion: todayRecord.emotion_card?.label || '不明',
              intensity: todayRecord.intensity_id || 1,
              transcript: todayRecord.voice_note || '',
              createdAt: todayRecord.created_at,
            });
            console.log('[useTodayEntry] 今日の記録を設定:', {
              id: todayRecord.id,
              date: today,
              emotion: todayRecord.emotion_card?.label || '不明',
              intensity: todayRecord.intensity_id || 1,
              transcript: todayRecord.voice_note || '',
              createdAt: todayRecord.created_at,
            });
          } else {
            setTodayEntry(null);
            console.log('[useTodayEntry] 今日の記録なし、日付比較が失敗');
          }
        } else {
          console.error(
            '[useTodayEntry] API呼び出し失敗:',
            response.status,
            response.statusText,
          );
          setTodayEntry(null);
        }
      } catch (error) {
        console.error('[useTodayEntry] 今日の記録取得エラー:', error);
        setTodayEntry(null);
      } finally {
        setIsLoading(false);
        console.log('[useTodayEntry] 読み込み完了');
      }
    };

    fetchTodayEntry();
  }, [user]);

  // デバッグ用: 状態変更をログ出力
  useEffect(() => {
    console.log('[useTodayEntry] 状態更新:', {
      todayEntry,
      isLoading,
      user: user?.id,
    });
  }, [todayEntry, isLoading, user]);

  return { todayEntry, isLoading };
}
