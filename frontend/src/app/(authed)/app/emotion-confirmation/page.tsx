'use client';

import { EmotionCard } from '@/components/emotion/EmotionCard';
import { AudioPlayer, KokoronDefault, Spinner } from '@/components/ui';
import { ANIMATION_DURATION } from '@/constants/emotion';
import { useEmotionConfirmation } from '@/hooks/useEmotionConfirmation';
import { commonStyles } from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

function EmotionConfirmationContent() {
  const router = useRouter();
  const [showGuide, setShowGuide] = useState(true);

  // カスタムフックを使用
  const {
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
  } = useEmotionConfirmation();

  // スワイプイベントハンドラー
  const onSwipeRight = () => {
    // 感情記録を保存
    saveEmotionLog();

    // 1秒後に次の画面に遷移
    setTimeout(() => {
      router.push(
        `/app/voice?emotion=${selectedEmotion?.id}&intensity=${selectedIntensity?.level}&child=${selectedChild?.id}&redirect=/app/voice/complete`,
      );
    }, ANIMATION_DURATION);
  };

  const onSwipeLeft = () => {
    // 感情選択画面に戻る
    setTimeout(() => {
      router.push('/app/emotion-selection');
    }, ANIMATION_DURATION);
  };

  // スワイプイベントの処理
  const handleSwipeEnd = () => {
    handleTouchEnd(onSwipeRight, onSwipeLeft);
  };

  // ガイドを非表示にする
  const hideGuide = () => {
    setShowGuide(false);
  };

  // 戻るボタンの処理
  const handleBack = () => {
    if (selectedEmotion) {
      router.push(`/app/emotion-intensity?emotion=${selectedEmotion.id}`);
    } else {
      router.push('/app/emotion-selection');
    }
  };

  // データ読み込み中
  if (isLoadingData) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>感情データを読み込み中...</p>
      </div>
    );
  }

  // エラーがある場合
  if (error) {
    return (
      <div style={commonStyles.page.container}>
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '20px',
            zIndex: 150,
          }}
        >
          <div
            style={{
              background: 'rgba(255, 0, 0, 0.1)',
              color: '#d32f2f',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '16px',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            {error}
          </div>
          <button
            onClick={handleBack}
            style={{
              background: '#007AFF',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '16px',
            }}
          >
            感情強度選択に戻る
          </button>
        </div>
      </div>
    );
  }

  // 感情が選択されていない場合
  if (!selectedEmotion || !selectedIntensity) {
    return (
      <div style={commonStyles.page.container}>
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '20px',
            zIndex: 150,
          }}
        >
          <div
            style={{
              background: 'rgba(255, 0, 0, 0.1)',
              color: '#d32f2f',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '16px',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            感情データが見つかりません
          </div>
          <button
            onClick={handleBack}
            style={{
              background: '#007AFF',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '16px',
            }}
          >
            感情強度選択に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={commonStyles.page.container}>
      {/* こころんによる感情確認の問いかけ音声再生 */}
      <AudioPlayer
        src="/sounds/characterConfirmFeeling03.mp3"
        autoPlay={true}
        volume={0.8}
        onEnded={() => console.log('感情確認音声再生完了')}
        onError={(error) => console.log('音声エラー:', error)}
      />

      {/* 左上の戻るボタン */}
      <button
        onClick={handleBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          color: '#000000',
          zIndex: 200,
          fontWeight: 'bold',
        }}
      >
        ← もどる
      </button>

      {/* こころんと吹き出し*/}
      <div
        style={{
          position: 'fixed',
          top: '100px',
          right: '2px',
          zIndex: 250,
        }}
      >
        <KokoronDefault size={100} />
      </div>

      {/* 感情の説明文（白い四角） */}
      {showGuide && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
            width: '80%',
            maxWidth: '320px',
            boxSizing: 'border-box',
            textAlign: 'center',
            alignSelf: 'center',
            margin: '0 auto',
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 150,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontWeight: 'bold',
                fontSize: '24px',
                lineHeight: 1.2,
                margin: 0,
                color: '#333',
              }}
            >
              こんなきもちなんだね？
            </span>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 0,
          padding: '10px 0 0 0',
          zIndex: 50,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '600px',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          background: 'transparent',
          gap: '8px',
        }}
      >
        {/* スワイプガイド - 矢印をカードに重ねて表示 */}
        {showGuide && (
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '600px',
            }}
          >
            <EmotionCard
              selectedEmotion={selectedEmotion}
              selectedIntensity={selectedIntensity}
              cardTransform={cardTransform}
              isDragging={isDragging}
              swipeDirection={swipeDirection}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleSwipeEnd}
              cardRef={cardRef}
            />
          </div>
        )}

        {/* スワイプ完了後のメッセージ */}
        {swipeDirection && (
          <div
            style={{
              background:
                swipeDirection === 'right'
                  ? 'rgba(76, 175, 80, 0.1)'
                  : 'rgba(244, 67, 54, 0.1)',
              color: swipeDirection === 'right' ? '#2E7D32' : '#C62828',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '400px',
              animation: 'fadeIn 0.5s ease-in',
            }}
          >
            {swipeDirection === 'right'
              ? 'OK！つぎにすすむよ〜'
              : 'もういちど　きもちを　えらぼうね'}
          </div>
        )}
      </div>

      {/* CSS アニメーション */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideRight {
          0% {
            transform: translateX(-20px);
            opacity: 0;
          }
          50% {
            transform: translateX(10px);
            opacity: 1;
          }
          100% {
            transform: translateX(-20px);
            opacity: 0;
          }
        }

        @keyframes slideLeft {
          0% {
            transform: translateX(20px);
            opacity: 0;
          }
          50% {
            transform: translateX(-10px);
            opacity: 1;
          }
          100% {
            transform: translateX(20px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function EmotionConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmotionConfirmationContent />
    </Suspense>
  );
}
