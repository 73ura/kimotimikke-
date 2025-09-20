'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useChildContext } from '@/contexts/ChildContext';
import { useSwipe } from '@/hooks/useSwipe';
import { useTodayEntry } from '@/hooks/useTodayEntry';
import { getEmotionLogsByMonth, getIntensities } from '@/lib/api';
import { borderRadius, colors, fontSize, spacing } from '@/styles/theme';
import { useEffect, useState } from 'react';

interface DailyReportProps {
  onClose: () => void;
}

interface EmotionLogData {
  id: string;
  date: string;
  content: string;
  mood: string;
  audio_file_path?: string;
  emotion_card?: {
    label: string;
    color: string;
    image_url: string;
  };
  intensity_id?: number;
}

interface Intensity {
  id: number;
  color_modifier: number;
}

export default function DailyReport({ onClose }: DailyReportProps) {
  const { user, firebaseUser } = useAuth();
  const { selectedChild, children, switchToNextChild, switchToPreviousChild } =
    useChildContext();
  const { todayEntry } = useTodayEntry();

  // スワイプ機能（複数の子供がいる場合のみ有効）
  const enableSwipe = children.length > 1;
  const { swipeHandlers } = useSwipe({
    onSwipeLeft: enableSwipe ? switchToNextChild : undefined,
    onSwipeRight: enableSwipe ? switchToPreviousChild : undefined,
    threshold: 50,
  });

  // JST時刻で初期化
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const jstOffset = 9 * 60; // JSTはUTC+9
    const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
    return jstTime.toISOString().split('T')[0];
  });

  // JST時刻で初期化
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    const jstOffset = 9 * 60;
    const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
    return jstTime;
  });

  const [emotionLogs, setEmotionLogs] = useState<EmotionLogData[]>([]);
  const [intensities, setIntensities] = useState<Intensity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // 今日の記録の自動選択
  useEffect(() => {
    if (todayEntry) {
      // 今日の日付をJSTで取得
      const now = new Date();
      const jstOffset = 9 * 60;
      const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
      const today = jstTime.toISOString().split('T')[0];

      setSelectedDate(today);
      setCurrentMonth(jstTime);
      console.log('[DailyReport] 今日の記録を自動選択:', today, todayEntry);
    }
  }, [todayEntry]);

  // デバッグ用のログ
  useEffect(() => {
    console.log('[DailyReport] 状態更新:', {
      todayEntry,
      selectedDate,
      currentMonth: currentMonth.toISOString().split('T')[0],
      emotionLogsCount: emotionLogs.length,
    });
  }, [todayEntry, selectedDate, currentMonth, emotionLogs]);

  // 感情ログデータ、感情カード、強度データを取得
  useEffect(() => {
    const fetchData = async () => {
      if (!firebaseUser) return;

      try {
        setIsLoading(true);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;

        const [logs, intensitiesData] = await Promise.all([
          getEmotionLogsByMonth(firebaseUser, year, month),
          getIntensities(firebaseUser),
        ]);

        setIntensities(intensitiesData.intensities || []);

        // 感情ログデータを変換
        const transformedLogs: EmotionLogData[] = logs.map(
          (log: {
            id: string;
            created_at: string;
            voice_note?: string;
            audio_file_path?: string;
            emotion_card?: {
              label: string;
              color: string;
              image_url: string;
            };
            intensity_id?: number;
          }) => {
            // JST変換を適用
            const utcDate = new Date(log.created_at);
            const jstOffset = 9 * 60; // JSTはUTC+9
            const jstDate = new Date(utcDate.getTime() + jstOffset * 60 * 1000);
            const jstDateStr = jstDate.toISOString().split('T')[0];

            // プレースホルダーテキストをチェック
            const isPlaceholderText =
              log.voice_note === '出力形式' ||
              log.voice_note?.includes('出力形式') ||
              !log.voice_note?.trim();

            return {
              id: log.id,
              date: jstDateStr,
              content: isPlaceholderText
                ? '音声メモがありません'
                : log.voice_note,
              mood: getEmotionMood(log.emotion_card?.label),
              audio_file_path: log.audio_file_path,
              emotion_card: log.emotion_card,
              intensity_id: log.intensity_id,
            };
          },
        );

        setEmotionLogs(transformedLogs);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setEmotionLogs([]);
        setIntensities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firebaseUser, currentMonth, todayEntry]);

  // 感情カードの画像URLを取得
  const getEmotionImageUrl = (emotionCard?: { image_url: string }): string => {
    if (!emotionCard?.image_url) return '';
    return emotionCard.image_url;
  };

  // 感情カード画像表示（WeeklyReportと同様に元のimage_urlを使用）
  const renderEmotionCard = (
    emotionCard?: { image_url: string; label: string },
    intensityId?: number,
  ) => {
    if (!emotionCard?.label) return null;

    // デバッグログ
    console.log('[DailyReport] 感情カード情報:', {
      label: emotionCard.label,
      intensityId,
      originalImageUrl: emotionCard.image_url,
    });

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: colors.background.white,
          borderRadius: borderRadius.small,
          overflow: 'hidden',
        }}
      >
        <img
          src={emotionCard.image_url}
          alt={`${emotionCard.label}の感情カード`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: borderRadius.small,
            backgroundColor: colors.background.white,
          }}
        />
      </div>
    );
  };

  // 感情ラベルから絵文字を取得（フォールバック用）
  const getEmotionMood = (label?: string): string => {
    if (!label) return '😐';

    const moodMap: { [key: string]: string } = {
      うれしい: '😊',
      かなしい: '😭',
      こわい: '😨',
      おこり: '😡',
      びっくり: '😲',
      しんぱい: '😰',
      はずかしい: '😳',
      こまった: '😅',
      わからない: '🤔',
      あんしん: '😌',
      きんちょう: '😰',
      ふゆかい: '😞',
      ゆかい: '😄',
    };

    return moodMap[label] || '😐';
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const selectedReport = emotionLogs.find(
    (report) => report.date === selectedDate,
  );

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const hasReport = (date: Date) => {
    const dateStr = formatDate(date);
    return emotionLogs.some((report) => report.date === dateStr);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日(${weekday})`;
  };

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    const firstDay = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    setSelectedDate(formatDate(firstDay));
  };

  // 日付をクリックした時の処理
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  // 音声ファイルのダウンロードURLを生成
  const getAudioDownloadUrl = async (audioPath: string) => {
    try {
      if (!user?.id) {
        console.error('user.idが存在しません');
        return null;
      }

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBaseUrl) {
        throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
      }

      console.log(
        '[DEBUG] API呼び出し:',
        `${apiBaseUrl}/api/v1/voice/records/${user.id}`,
      );

      const response = await fetch(
        `${apiBaseUrl}/api/v1/voice/records/${user.id}`,
      );

      if (!response.ok) {
        console.error('API呼び出し失敗:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log('[DEBUG] API応答:', data);

      // 該当する音声ファイルのダウンロードURLを探す
      const record = data.records.find(
        (r: { audio_path: string }) => r.audio_path === audioPath,
      );
      console.log('[DEBUG] 該当レコード:', record);

      return record?.audio_download_url || null;
    } catch (error) {
      console.error('音声ファイルURLの取得に失敗:', error);
      return null;
    }
  };

  // 音声再生処理を修正
  const handleAudioPlay = async (audioPath: string) => {
    if (isPlaying && audio) {
      // 現在再生中の場合は停止
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setAudio(null);
    } else {
      try {
        // ダウンロードURLを取得
        const downloadUrl = await getAudioDownloadUrl(audioPath);

        if (!downloadUrl) {
          console.error('音声ファイルのダウンロードURLが取得できません');
          return;
        }

        console.log('[AUDIO] 再生開始:', downloadUrl);

        const newAudio = new Audio(downloadUrl);
        newAudio.addEventListener('ended', () => {
          setIsPlaying(false);
          setAudio(null);
        });
        newAudio.addEventListener('error', (e) => {
          console.error('音声ファイルの再生に失敗しました:', e);
          console.error('元のパス:', audioPath);
          console.error('ダウンロードURL:', downloadUrl);
          setIsPlaying(false);
          setAudio(null);
        });

        await newAudio.play();
        setIsPlaying(true);
        setAudio(newAudio);
      } catch (error) {
        console.error('音声再生エラー:', error);
        setIsPlaying(false);
        setAudio(null);
      }
    }
  };

  // 選択された日付の枠線色を生成
  const getEmotionBorderColor = (
    emotionCard?: { label: string; color: string },
    intensityId?: number,
  ): string => {
    if (!emotionCard?.color) return '#cccccc';

    // 強度IDからcolor_modifierを取得
    const intensity = intensities.find((i) => i.id === intensityId);
    const colorModifier = intensity?.color_modifier || 1.0;

    // HEXカラーをRGBAに変換（colorModifierを透明度として使用）
    const hexToRgba = (hex: string, alpha: number): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return hexToRgba(emotionCard.color, colorModifier);
  };

  if (isLoading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: borderRadius.large,
            padding: spacing.xl,
            textAlign: 'center',
          }}
        >
          <div>データを読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      {...swipeHandlers}
    >
      <div
        style={{
          backgroundColor: colors.background.white,
          borderRadius: borderRadius.large,
          padding: spacing.xl,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          border: `3px solid #cccccc`,
          width: '500px',
          height: '800px',
        }}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: spacing.md,
            right: spacing.md,
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: colors.text.secondary,
            zIndex: 1001,
          }}
        >
          ×
        </button>

        {/* タイトル */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <h2
            style={{
              color: colors.secondary,
              fontSize: fontSize.large,
              fontWeight: 'bold',
              margin: 0,
            }}
          >
            まいにちのきろく
            {selectedChild && (
              <span
                style={{
                  fontSize: fontSize.base,
                  fontWeight: 'normal',
                  marginLeft: spacing.sm,
                }}
              >
                - {selectedChild.nickname}
              </span>
            )}
          </h2>
        </div>

        {/* 選択された日付の表示 */}
        <div
          style={{
            backgroundColor: colors.primary,
            color: colors.background.white,
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: borderRadius.small,
            textAlign: 'center',
            marginBottom: spacing.md,
            fontSize: fontSize.large,
            fontWeight: 'bold',
          }}
        >
          {formatDisplayDate(selectedDate)}
        </div>

        {/* カレンダー部分 */}
        <div
          style={{
            border: `3px solid #cccccc`,
            borderRadius: borderRadius.medium,
            padding: spacing.md,
            marginBottom: spacing.lg,
            backgroundColor: colors.background.white,
            height: '450px',
          }}
        >
          {/* 月表示とナビゲーション */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <button
              onClick={() => {
                const newMonth = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1,
                  1,
                );
                handleMonthChange(newMonth);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.primary,
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: fontSize.base, fontWeight: 'bold' }}>
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </span>
            <button
              onClick={() => {
                const newMonth = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  1,
                );
                handleMonthChange(newMonth);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.primary,
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ›
            </button>
          </div>

          {/* 曜日ヘッダー */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
              marginBottom: spacing.sm,
            }}
          >
            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  color: colors.text.secondary,
                  padding: spacing.xs,
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
            }}
          >
            {calendarDays.map((date, index) => {
              const isCurrentMonth =
                date.getMonth() === currentMonth.getMonth();
              const dateStr = formatDate(date);
              const report = emotionLogs.find((log) => log.date === dateStr);
              const emotionImageUrl = getEmotionImageUrl(report?.emotion_card);
              const isSelected = selectedDate === dateStr;

              // 該当月以外の日付は表示しない
              if (!isCurrentMonth) {
                return (
                  <div
                    key={index}
                    style={{
                      width: '40px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                );
              }

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(dateStr)}
                  style={{
                    width: '40px',
                    height: '60px',
                    borderRadius: borderRadius.small,
                    backgroundColor: colors.background.white,
                    color: colors.text.primary,
                    fontSize: fontSize.large,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    border: isSelected
                      ? `2px solid ${getEmotionBorderColor(report?.emotion_card, report?.intensity_id)}`
                      : 'none',
                    padding: '4px 0',
                  }}
                >
                  <span style={{ marginTop: '2px' }}>{date.getDate()}</span>
                  {report && emotionImageUrl && emotionImageUrl !== '' && (
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        marginBottom: '2px',
                      }}
                    >
                      {renderEmotionCard(
                        report.emotion_card,
                        report.intensity_id,
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* レポート表示部分 */}
        <div
          style={{
            border: `3px solid #cccccc`,
            borderRadius: borderRadius.medium,
            padding: spacing.md,
            backgroundColor: colors.background.white,
            height: '180px',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {selectedReport ? (
            <div>
              <div
                style={{
                  fontSize: fontSize.large,
                  color: colors.text.primary,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  paddingRight: '60px', // 画像のスペース
                }}
              >
                {selectedReport.content}
              </div>

              {/* 音声再生ボタン */}
              {selectedReport.audio_file_path && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: spacing.sm,
                    left: spacing.sm,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}
                >
                  <button
                    onClick={() =>
                      handleAudioPlay(selectedReport.audio_file_path!)
                    }
                    style={{
                      background: isPlaying ? '#e74c3c' : colors.primary,
                      color: colors.background.white,
                      border: 'none',
                      borderRadius: borderRadius.small,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      cursor: 'pointer',
                      fontSize: fontSize.small,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isPlaying ? '⏹️ 停止' : '▶️ 音声メモを再生'}
                  </button>
                </div>
              )}

              {/* 感情カード画像を右下に表示 */}
              {selectedReport.emotion_card?.image_url && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: spacing.sm,
                    right: spacing.sm,
                    width: '50px',
                    height: '50px',
                    borderRadius: borderRadius.small,
                    overflow: 'hidden',
                    border: `2px solid ${getEmotionBorderColor(selectedReport.emotion_card, selectedReport.intensity_id)}`,
                    backgroundColor: colors.background.white,
                  }}
                >
                  {renderEmotionCard(
                    selectedReport.emotion_card,
                    selectedReport.intensity_id,
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: colors.text.secondary,
                fontSize: fontSize.large,
              }}
            >
              この日付にはレポートがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
