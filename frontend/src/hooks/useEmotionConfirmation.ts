import {
  API_ENDPOINTS,
  INTENSITY_LEVELS,
  SWIPE_THRESHOLD,
} from '@/constants/emotion';
import { useAuth } from '@/contexts/AuthContext';
import {
  CardTransform,
  Child,
  DragStart,
  Emotion,
  EmotionIntensity,
} from '@/types/emotion';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export const useEmotionConfirmation = () => {
  const { user, firebaseUser } = useAuth();
  const searchParams = useSearchParams();

  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [selectedIntensity, setSelectedIntensity] =
    useState<EmotionIntensity | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // スワイプ関連の状態
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null,
  );
  const [cardTransform, setCardTransform] = useState<CardTransform>({
    x: 0,
    y: 0,
    rotation: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragStart>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // データ取得処理
  useEffect(() => {
    const emotionId = searchParams.get('emotion');
    const intensityLevel = searchParams.get('intensity');

    if (!emotionId || !intensityLevel) {
      setError('感情または強度が選択されていません');
      return;
    }

    // 強度レベルを文字列からIDに変換
    const intensityLevelMap: { [key: string]: number } = {
      low: 1,
      medium: 2,
      high: 3,
    };

    const intensityId =
      intensityLevelMap[intensityLevel] || parseInt(intensityLevel);

    console.log('🎯 感情確認: デバッグ情報', {
      emotionId,
      intensityLevel,
      intensityId,
      intensityLevelMap,
    });

    if (!intensityId) {
      console.error('🎯 感情確認: 無効な強度レベル', intensityLevel);
      setError('無効な強度レベルです');
      return;
    }

    const fetchEmotionData = async () => {
      setIsLoadingData(true);
      setError(null);

      try {
        // 認証トークンを取得
        const idToken = firebaseUser ? await firebaseUser.getIdToken() : null;

        const [emotionResponse, intensityResponse, childrenResponse] =
          await Promise.all([
            fetch(API_ENDPOINTS.EMOTION_CARDS),
            fetch(API_ENDPOINTS.EMOTION_INTENSITIES),
            fetch(API_ENDPOINTS.EMOTION_CHILDREN(user?.uid || ''), {
              headers: idToken
                ? {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                  }
                : {},
            }),
          ]);

        if (
          !emotionResponse.ok ||
          !intensityResponse.ok ||
          !childrenResponse.ok
        ) {
          throw new Error('データの取得に失敗しました');
        }

        const emotionData = await emotionResponse.json();
        const intensityData = await intensityResponse.json();
        const childrenData = await childrenResponse.json();

        if (emotionData.success && intensityData.success && childrenData) {
          console.log('🎯 感情確認: 感情データ取得成功');
          console.log('🎯 感情確認: 強度データ取得成功');
          console.log('🎯 感情確認: 子供データ取得成功');

          const childrenArray = childrenData.children || childrenData || [];
          setChildren(childrenArray);

          // 子供が1人しかいない場合は自動選択
          if (childrenArray.length === 1) {
            setSelectedChild(childrenArray[0]);
          } else if (childrenArray.length === 0) {
            setError(
              '子供の登録がありません。設定画面で子供を登録してください。',
            );
            return;
          }

          // 選択された感情を取得
          const emotion = emotionData.cards.find(
            (e: Emotion) => e.id === emotionId,
          );
          if (emotion) {
            console.log('🎯 感情確認: 選択された感情:', emotion);
            setSelectedEmotion(emotion);

            const intensity = INTENSITY_LEVELS.find(
              (level) => level.id === intensityId,
            );
            console.log(
              '🎯 感情確認: 強度レベル検索結果:',
              intensityLevel,
              intensityId,
              intensity,
            );

            if (intensity) {
              const intensityDataItem = intensityData.intensities.find(
                (i: any) => i.id === intensityId,
              );
              console.log(
                '🎯 感情確認: 強度データ検索結果:',
                intensity.id,
                intensityDataItem,
              );

              const selectedIntensityData = {
                id: intensity.id,
                level: intensity.level as 'low' | 'medium' | 'high',
                label: emotion.label,
                description: intensity.description
                  ? `${intensity.description}${emotion.label}`
                  : emotion.label,
                colorModifier: intensityDataItem
                  ? intensityDataItem.color_modifier
                  : 1.0,
              };

              console.log(
                '🎯 感情確認: 設定する強度データ:',
                selectedIntensityData,
              );
              setSelectedIntensity(selectedIntensityData);
            }
          } else {
            throw new Error('選択された感情が見つかりません');
          }
        } else {
          throw new Error('データの形式が正しくありません');
        }
      } catch (err) {
        console.error('データの取得エラー:', err);
        setError('データの読み込みに失敗しました');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchEmotionData();
  }, [searchParams, user]);

  // スワイプイベントハンドラー
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setCardTransform({ x: 0, y: 0, rotation: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    const rotation = deltaX * 0.1;

    setCardTransform({
      x: deltaX,
      y: deltaY,
      rotation: rotation,
    });
  };

  const handleTouchEnd = (
    onSwipeRight: () => void,
    onSwipeLeft: () => void,
  ) => {
    if (!isDragging) return;

    setIsDragging(false);

    if (Math.abs(cardTransform.x) > SWIPE_THRESHOLD) {
      if (cardTransform.x > 0) {
        setSwipeDirection('right');
        onSwipeRight();
      } else {
        setSwipeDirection('left');
        onSwipeLeft();
      }
    } else {
      setCardTransform({ x: 0, y: 0, rotation: 0 });
    }
  };

  // 感情記録保存
  const saveEmotionLog = async () => {
    console.log('🎯 感情確認: 感情ログ保存開始');
    console.log('🎯 感情確認: 保存するデータ:', {
      user_id: user?.uid || '00000000-0000-0000-0000-000000000000',
      child_id: selectedChild?.id || '00000000-0000-0000-0000-000000000000',
      emotion_card_id: selectedEmotion?.id,
      intensity_id: selectedIntensity?.id,
      voice_note: null,
      text_file_path: null,
      audio_file_path: null,
    });

    try {
      // LOG: APIリクエスト送信（本番環境では削除推奨）
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 感情確認: APIリクエスト送信中...');
      }
      const response = await fetch(API_ENDPOINTS.EMOTION_LOGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NOTE: 認証トークンをヘッダーに含める必要がある
          Authorization: `Bearer ${await firebaseUser!.getIdToken()}`,
        },
        body: JSON.stringify({
          // user_idは送信しない（バックエンドで認証されたユーザーから取得）
          child_id: selectedChild?.id || '00000000-0000-0000-0000-000000000000',
          emotion_card_id: selectedEmotion?.id,
          intensity_id: selectedIntensity?.id,
          voice_note: null,
          text_file_path: null,
          audio_file_path: null,
        }),
      });

      console.log(
        '🎯 感情確認: APIレスポンス受信:',
        response.status,
        response.statusText,
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log('🎯 感情確認: 感情記録が保存されました:', responseData);
      } else {
        const errorData = await response.text();
        console.error(
          '🎯 感情確認: 感情記録の保存に失敗しました:',
          response.status,
          errorData,
        );
      }
    } catch (error) {
      console.error('🎯 感情確認: 感情記録保存エラー:', error);
    }
  };

  return {
    selectedEmotion,
    selectedIntensity,
    children,
    selectedChild,
    isLoadingData,
    error,
    swipeDirection,
    cardTransform,
    isDragging,
    cardRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    saveEmotionLog,
  };
};
