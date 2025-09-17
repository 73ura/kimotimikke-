'use client';

import KokoronReadingReport from '@/components/ui/KokoronReadingReport';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SpeechBubble from '@/components/ui/SpeechBubble';
import Spinner from '@/components/ui/Spinner';
import { useChildren } from '@/hooks/useChildren';
import { useSubscription } from '@/hooks/useSubscription';
import { useTodayEntry } from '@/hooks/useTodayEntry';
import {
  borderRadius,
  colors,
  commonStyles,
  fontSize,
  spacing,
} from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TodayEntryPage() {
  const router = useRouter();
  const { todayEntry, isLoading } = useTodayEntry();
  const { loading: childrenLoading } = useChildren();
  const { loading: subscriptionLoading } = useSubscription();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // 今日の日付を取得
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 記録の存在確認
  const hasEntry = !!todayEntry;

  // 更新処理
  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // 感情選択画面から開始
      router.push('/app/emotion-selection');
    } catch (error) {
      console.error('更新処理でエラーが発生しました:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // キャラクターのセリフを生成
  const getCharacterSpeech = () => {
    if (hasEntry) {
      return [
        `きょうのきろくがあるよ！`,
        `きもちをきろくしてみよう！`,
        `1にち1けんのせいやくがあるから、`,
        `じゅうふくきろくはじどうてきにこうしんされるよ。`,
      ];
    } else {
      return [
        `きょうのきろくはまだないね。`,
        `きもちをきろくしてみよう！`,
        `1にち1けんのせいやくがあるから、`,
        `じゅうふくきろくはじどうてきにこうしんされるよ。`,
      ];
    }
  };

  // 感情カードの画像URLを取得
  const getEmotionImageUrl = (emotionCard?: { image_url: string }): string => {
    if (!emotionCard?.image_url) return '';
    return emotionCard.image_url;
  };

  // 強度に応じた感情画像URLを生成
  const getIntensityBasedImageUrl = (
    emotionCard?: { label: string },
    intensityId?: number,
  ): string => {
    if (!emotionCard?.label) return '';

    const EMOTION_NAME_TO_FILENAME: { [key: string]: string } = {
      うれしい: 'ureshii',
      かなしい: 'kanashii',
      こわい: 'kowai',
      おこり: 'ikari',
      びっくり: 'bikkuri',
      しんぱい: 'kinchou',
      はずかしい: 'hazukashii',
      こまった: 'komatta',
      わからない: 'wakaranai',
      あんしん: 'anshin',
      きんちょう: 'kinchou',
      ふゆかい: 'fuyukai',
      ゆかい: 'yukai',
    };

    const baseName = EMOTION_NAME_TO_FILENAME[emotionCard.label] || 'ureshii';
    let fileName = baseName;

    // 強度に応じてファイル名を変更
    if (intensityId === 1) {
      fileName = `${baseName}1`;
    } else if (intensityId === 3) {
      fileName = `${baseName}3`;
    }

    return `/images/emotions/${fileName}.webp`;
  };

  // 感情と強度を組み合わせた画像表示
  const renderEmotionWithIntensity = (
    emotionLabel: string,
    intensity: number,
  ) => {
    if (!emotionLabel) return null;

    // 強度に応じた画像URLを生成
    const intensityImageUrl = getIntensityBasedImageUrl(
      { label: emotionLabel },
      intensity,
    );

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
          src={intensityImageUrl}
          alt={`${emotionLabel}の感情カード（強度${intensity}）`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: borderRadius.small,
            backgroundColor: colors.background.white,
          }}
          onError={(e) => {
            try {
              // エラー時はデフォルト画像を使用
              (e.currentTarget as HTMLImageElement).src =
                '/images/emotions/ureshii.webp';
            } catch (_) {
              // no-op
            }
          }}
        />
      </div>
    );
  };

  // 音声ファイルのダウンロードURLを生成
  const getAudioDownloadUrl = async (audioUrl: string) => {
    try {
      if (!todayEntry?.id) {
        console.error('todayEntry.idが存在しません');
        return null;
      }

      // audioUrlが既に完全なURLの場合はそのまま返す
      if (audioUrl.startsWith('http')) {
        return audioUrl;
      }

      // 相対パスの場合は、APIから取得を試みる
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBaseUrl) {
        throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
      }

      const response = await fetch(
        `${apiBaseUrl}/api/v1/voice/records/${todayEntry.id}`,
      );

      if (!response.ok) {
        console.error('API呼び出し失敗:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();

      // 該当する音声ファイルのダウンロードURLを探す
      const record = data.records.find((r: any) => r.audio_path === audioUrl);

      return record?.audio_download_url || audioUrl;
    } catch (error) {
      console.error('音声ファイルURLの取得に失敗:', error);
      return audioUrl; // エラーの場合は元のURLを返す
    }
  };

  // 音声再生処理
  const handleAudioPlay = async (audioUrl: string) => {
    if (isPlaying && audio) {
      // 現在再生中の場合は停止
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setAudio(null);
    } else {
      try {
        // ダウンロードURLを取得
        const downloadUrl = await getAudioDownloadUrl(audioUrl);

        if (!downloadUrl) {
          console.error('音声ファイルのダウンロードURLが取得できません');
          return;
        }

        const newAudio = new Audio(downloadUrl);
        newAudio.addEventListener('ended', () => {
          setIsPlaying(false);
          setAudio(null);
        });
        newAudio.addEventListener('error', (e) => {
          console.error('音声ファイルの再生に失敗しました:', e);
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

  // ローディング状態
  if (isLoading || childrenLoading || subscriptionLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="large" />
        <p style={{ color: colors.text.secondary, marginTop: spacing.md }}>
          データを読み込み中...
        </p>
      </div>
    );
  }

  return (
    <div style={commonStyles.page.container}>
      {/* ヘッダー */}
      <div
        style={{
          background: colors.background.white,
          boxShadow: colors.shadow.light,
          borderBottom: `1px solid ${colors.border.light}`,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: `${spacing.xl} ${spacing.lg}`,
          }}
        >
          <h1
            style={{
              fontSize: fontSize.xxl,
              fontWeight: 'bold',
              color: colors.text.primary,
              margin: 0,
              marginBottom: spacing.sm,
            }}
          >
            今日の記録
          </h1>
          <p
            style={{
              fontSize: fontSize.large,
              color: colors.text.secondary,
              margin: 0,
            }}
          >
            {today}
          </p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: `${spacing.xxl} ${spacing.lg}`,
          marginTop: '120px', // ヘッダーの高さ分
        }}
      >
        {/* キャラクターとセリフ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          {/* セリフバブル */}
          <SpeechBubble text={getCharacterSpeech()} />

          {/* キャラクター */}
          <KokoronReadingReport size={200} />
        </div>

        {/* 記録がある場合の詳細表示 */}
        {hasEntry && (
          <div
            style={{
              ...commonStyles.card,
              marginBottom: spacing.xl,
            }}
          >
            <h2
              style={{
                fontSize: fontSize.xl,
                fontWeight: 'bold',
                color: colors.text.primary,
                margin: 0,
                marginBottom: spacing.lg,
              }}
            >
              記録の詳細
            </h2>

            {/* DailyReportスタイルのレポート表示部分 */}
            <div
              style={{
                border: `3px solid #cccccc`,
                borderRadius: borderRadius.medium,
                padding: spacing.md,
                backgroundColor: colors.background.white,
                minHeight: '200px',
                position: 'relative',
                marginBottom: spacing.lg,
              }}
            >
              <div
                style={{
                  fontSize: fontSize.large,
                  color: colors.text.primary,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  paddingRight: '60px', // 画像のスペース
                }}
              >
                {todayEntry.transcript || '音声メモがありません'}
              </div>

              {/* 音声再生ボタン */}
              {todayEntry.audioUrl && (
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
                    onClick={() => handleAudioPlay(todayEntry.audioUrl!)}
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
              {todayEntry.emotion && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: spacing.sm,
                    right: spacing.sm,
                    width: '50px',
                    height: '50px',
                    borderRadius: borderRadius.small,
                    overflow: 'hidden',
                    border: `2px solid ${colors.primary}`,
                    backgroundColor: colors.background.white,
                  }}
                >
                  {renderEmotionWithIntensity(
                    todayEntry.emotion,
                    todayEntry.intensity,
                  )}
                </div>
              )}
            </div>

            {/* 記録の基本情報 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: spacing.lg,
                marginBottom: spacing.xl,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: fontSize.small,
                    fontWeight: 'bold',
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                  }}
                >
                  感情
                </label>
                <p
                  style={{
                    color: colors.text.primary,
                    fontSize: fontSize.base,
                    margin: 0,
                  }}
                >
                  {todayEntry.emotion}
                </p>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: fontSize.small,
                    fontWeight: 'bold',
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                  }}
                >
                  感情強度
                </label>
                <p
                  style={{
                    color: colors.text.primary,
                    fontSize: fontSize.base,
                    margin: 0,
                  }}
                >
                  {todayEntry.intensity}
                </p>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: fontSize.small,
                    fontWeight: 'bold',
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                  }}
                >
                  作成日時
                </label>
                <p
                  style={{
                    color: colors.text.primary,
                    fontSize: fontSize.base,
                    margin: 0,
                  }}
                >
                  {new Date(todayEntry.createdAt).toLocaleString('ja-JP')}
                </p>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: fontSize.small,
                    fontWeight: 'bold',
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                  }}
                >
                  記録日
                </label>
                <p
                  style={{
                    color: colors.text.primary,
                    fontSize: fontSize.base,
                    margin: 0,
                  }}
                >
                  {new Date(todayEntry.date).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>

            {/* アクションボタン */}
            <div
              style={{
                display: 'flex',
                gap: spacing.lg,
                flexWrap: 'wrap',
              }}
            >
              <PrimaryButton
                onClick={handleUpdate}
                disabled={isUpdating}
                style={{
                  minWidth: '150px',
                }}
              >
                {isUpdating ? '更新中...' : '記録を更新'}
              </PrimaryButton>
              <button
                onClick={() => router.push('/app/emotion-selection')}
                style={{
                  ...commonStyles.button.base,
                  ...commonStyles.button.secondary,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  minWidth: '150px',
                }}
              >
                感情選択ページへ
              </button>
            </div>
          </div>
        )}

        {/* 記録がない場合の案内 */}
        {!hasEntry && (
          <div
            style={{
              ...commonStyles.card,
              textAlign: 'center',
              padding: spacing.xxl,
            }}
          >
            <h2
              style={{
                fontSize: fontSize.xl,
                fontWeight: 'bold',
                color: colors.text.primary,
                margin: 0,
                marginBottom: spacing.md,
              }}
            >
              記録を始めましょう
            </h2>
            <p
              style={{
                fontSize: fontSize.base,
                color: colors.text.secondary,
                margin: 0,
                marginBottom: spacing.lg,
              }}
            >
              今日の気持ちを記録してみましょう！
            </p>
            <PrimaryButton
              onClick={() => router.push('/app/emotion-selection')}
              style={{
                minWidth: '200px',
              }}
            >
              記録を始める
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
