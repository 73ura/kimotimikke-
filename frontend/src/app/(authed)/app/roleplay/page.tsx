'use client';

import {
  HamburgerMenu,
  KokoronDefault,
  MenuItem,
  SpeechBubble,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useChildContext } from '@/contexts/ChildContext';
import { useEmotionSelection } from '@/hooks/useEmotionSelection';
import { useRoleplay } from '@/hooks/useRoleplay';
import { useRoleplayAdvice } from '@/hooks/useRoleplayAdvice';
import {
  borderRadius,
  colors,
  commonStyles,
  fontSize,
  spacing,
} from '@/styles/theme';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useEffect, useState } from 'react';

// 感情ラベルを自然な日本語に整える関数
function getEmotionPhrase(emotion: { id: string; label: string }): string {
  switch (emotion.id) {
    case 'fuyukai':
      return 'ふゆかいなきもち';
    case 'ikari':
      return 'いかりのきもち';
    default:
      return `${emotion.label}きもち`;
  }
}

// ページ専用モーダル
function RoleplayModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.background.white,
          borderRadius: borderRadius.large,
          padding: spacing.lg,
          maxWidth: '95vw',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: colors.shadow.menu,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function RoleplayPage() {
  // CSSアニメーションを動的に追加
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rainbowShift {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const { user, isLoading, logout } = useAuth();
  const { selectedChild } = useChildContext();
  const router = useRouter();
  const [step, setStep] = useState<'list' | 'emotion'>('list');
  const [showAdvice, setShowAdvice] = useState(false);

  // ロールプレイフック（選択された子供を使用）
  const {
    scenarios,
    sessions,
    roleplayState,
    selectScenario,
    selectEmotion,
    resetRoleplayState,
    startSession,
    completeSession,
    abandonSession,
    updateSession,
    loading: roleplayLoading,
    error: roleplayError,
  } = useRoleplay(selectedChild?.id || undefined);

  // 感情選択フック
  const { emotions, isLoadingEmotions } = useEmotionSelection();

  // アドバイスフック（シナリオと感情が選択された時のみ）
  const { advice, loading: adviceLoading } = useRoleplayAdvice(
    roleplayState.selectedScenario || '',
    roleplayState.selectedEmotion || '',
  );

  // デバッグ用ログ
  console.log('=== アドバイスデバッグ ===');
  console.log('selectedScenario:', roleplayState.selectedScenario);
  console.log('selectedEmotion:', roleplayState.selectedEmotion);
  console.log('advice:', advice);
  console.log('adviceLoading:', adviceLoading);
  console.log('showAdvice:', showAdvice);
  console.log('========================');

  // 戻るボタンの処理
  const handleBack = () => {
    router.push('/app');
  };

  // ログアウト処理
  const handleLogout = async () => {
    await logout();
  };

  // シナリオ選択処理（セッション開始も同時に実行）
  const handleScenarioSelect = async (scenarioId: string) => {
    selectScenario(scenarioId);
    setStep('emotion');

    // シナリオ選択時にセッション開始（scenarioIdを直接渡す）
    try {
      await startSession(scenarioId);
      console.log('シナリオ選択: セッション開始完了');
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  // 体験済みのシナリオかどうかを判定
  const isExperiencedScenario = (scenarioId: string) => {
    return sessions.some(
      (session) =>
        session.scenario_id === scenarioId &&
        session.completion_status === 'completed',
    );
  };

  // 感情選択処理
  const handleEmotionSelect = (emotionId: string) => {
    selectEmotion(emotionId);
  };

  // 感情選択後にセッションのselected_emotion_idを更新
  useEffect(() => {
    if (roleplayState.selectedEmotion && roleplayState.currentSessionId) {
      const updateSessionEmotion = async () => {
        try {
          await updateSession(roleplayState.currentSessionId!, {
            selected_emotion_id: roleplayState.selectedEmotion || undefined,
          });
          console.log(
            'セッションの感情IDを更新しました:',
            roleplayState.selectedEmotion,
          );
        } catch (error) {
          console.error('Failed to update session emotion:', error);
        }
      };
      updateSessionEmotion();
    }
  }, [roleplayState.selectedEmotion, roleplayState.currentSessionId]);

  // ローディング中（認証）
  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  // ログインしていない場合
  if (!user) {
    router.push('/');
    return null;
  }

  // 子供が登録されていない場合
  if (!selectedChild) {
    return (
      <div style={commonStyles.page.container}>
        <HamburgerMenu>
          <MenuItem onClick={handleBack}>ホームに戻る</MenuItem>
          <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
        </HamburgerMenu>
        <div style={commonStyles.page.mainContent}>
          <div style={{ textAlign: 'center' }}>
            <h2>子供を登録してください</h2>
            <p>
              ロールプレイを開始するには、まず子供を登録する必要があります。
            </p>
            <button
              onClick={() => router.push('/app/setup')}
              style={{
                padding: `${spacing.lg} ${spacing.xl}`,
                fontSize: fontSize.large,
                border: 'none',
                borderRadius: borderRadius.button,
                backgroundColor: colors.primary,
                color: colors.text.white,
                cursor: 'pointer',
                marginTop: spacing.lg,
              }}
            >
              子供を登録する
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ローディング中（データ取得）
  if (roleplayLoading || isLoadingEmotions) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>シナリオを読み込み中...</p>
      </div>
    );
  }

  // エラー表示
  if (roleplayError) {
    return (
      <div style={commonStyles.page.container}>
        <HamburgerMenu>
          <MenuItem onClick={handleBack}>ホームに戻る</MenuItem>
          <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
        </HamburgerMenu>
        <div style={commonStyles.page.mainContent}>
          <div style={{ textAlign: 'center' }}>
            <h2>エラーが発生しました</h2>
            <p>{roleplayError}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: `${spacing.lg} ${spacing.xl}`,
                fontSize: fontSize.large,
                border: 'none',
                borderRadius: borderRadius.button,
                backgroundColor: colors.primary,
                color: colors.text.white,
                cursor: 'pointer',
                marginTop: spacing.lg,
              }}
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  // シナリオ一覧画面
  if (step === 'list') {
    return (
      <div style={commonStyles.page.container}>
        <HamburgerMenu>
          <MenuItem onClick={handleBack}>ホームに戻る</MenuItem>
          <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
        </HamburgerMenu>

        <div style={commonStyles.page.mainContent}>
          <div style={{ transform: 'scale(1.3)' }}>
            <SpeechBubble text="シナリオをえらんでね" />
          </div>

          {/* こころん - 固定サイズ */}
          <div
            style={{
              marginBottom: spacing.xl,
              minHeight: '200px', // 最小高さを確保
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KokoronDefault size={200} /> {/* 固定サイズ */}
          </div>

          {/* シナリオボタンエリア - スクロール可能 */}
          <div
            style={{
              width: '100%',
              maxWidth: '95vw',
              padding: '0 20px',
              maxHeight: '60vh', // 最大高さを制限
              overflowY: 'auto', // 縦スクロール
              overflowX: 'hidden',
              // スクロールバーのスタイリング
              scrollbarWidth: 'thin',
              scrollbarColor: '#ccc transparent',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // 適度なサイズに調整
                gap: spacing.lg,
                width: '100%',
              }}
            >
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioSelect(scenario.id)}
                  style={{
                    width: '100%',
                    minHeight: '80px', // 高さを少し下げて横長感を強調
                    fontSize: 'clamp(18px, 4.5vw, 28px)', // フォントサイズを少し大きく
                    fontWeight: '700',
                    borderRadius: borderRadius.large,
                    background: scenario.color,
                    color: colors.text.white,
                    border: 'none',
                    boxShadow: colors.shadow.light,
                    padding: `${spacing.md} ${spacing.xl}`, // 縦のパディングを少し減らす
                    whiteSpace: 'pre-line', // 改行を保持
                    wordBreak: 'break-word',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    lineHeight: 1.3, // 行間を調整
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {scenario.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 感情選択画面
  if (step === 'emotion') {
    const selectedScenario = scenarios.find(
      (s) => s.id === roleplayState.selectedScenario,
    );
    const selectedEmotion = emotions.find(
      (e) => e.id === roleplayState.selectedEmotion,
    );

    if (!selectedScenario) {
      return (
        <div style={commonStyles.page.container}>
          <div style={{ textAlign: 'center' }}>
            <h2>シナリオが見つかりません</h2>
            <button onClick={() => setStep('list')}>シナリオ選択に戻る</button>
          </div>
        </div>
      );
    }

    return (
      <div style={commonStyles.page.container}>
        <HamburgerMenu>
          <MenuItem onClick={handleBack}>ホームに戻る</MenuItem>
          <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
        </HamburgerMenu>

        {/* ← もどる */}
        <p
          onClick={() => {
            setStep('list');
            setShowAdvice(false);
          }}
          style={{
            position: 'fixed',
            top: spacing.xl,
            left: spacing.xl,
            fontSize: fontSize.large,
            color: colors.text.primary,
            cursor: 'pointer',
            fontWeight: 'bold',
            zIndex: 200,
          }}
        >
          ← もどる
        </p>

        {/* 中央にまとめるラッパー */}
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.lg,
            width: '100%',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '20px',
            zIndex: 100,
          }}
        >
          {/* シナリオカード */}
          <div
            style={{
              background: colors.background.light,
              borderRadius: borderRadius.button,
              padding: spacing.xl,
              boxShadow: colors.shadow.menu,
              textAlign: 'center',
              width: '90%',
            }}
          >
            <p
              style={{
                fontSize: fontSize.xxl,
                marginBottom: spacing.lg,
                color: colors.text.secondary,
              }}
            >
              {selectedScenario.description || selectedScenario.title}
            </p>
            <img
              src={selectedScenario.image_url || '/images/roleplay.webp'}
              alt="ロールプレイのイラスト"
              style={{ width: '100%', maxWidth: '240px', height: 'auto' }}
            />
          </div>

          {/* 感情カード */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: spacing.md,
              width: '100%',
              maxWidth: '400px',
            }}
          >
            {emotions.map((emotion) => (
              <button
                key={emotion.id}
                onClick={() => handleEmotionSelect(emotion.id)}
                style={{
                  background: colors.background.white,
                  border: `3px solid ${emotion.color}`,
                  borderRadius: borderRadius.large,
                  padding: spacing.sm,
                  textAlign: 'center',
                  boxShadow: colors.shadow.light,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  minHeight: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <img
                  src={emotion.image_url}
                  alt={emotion.label}
                  style={{
                    width: 'clamp(40px, 8vw, 60px)',
                    height: 'auto',
                    marginBottom: spacing.xs,
                  }}
                />
                <p
                  style={{
                    fontWeight: 'bold',
                    fontSize: 'clamp(12px, 3vw, 16px)',
                    margin: 0,
                    wordBreak: 'break-word',
                  }}
                >
                  {emotion.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* モーダル */}
        <RoleplayModal
          open={!!selectedEmotion}
          onClose={async () => {
            setShowAdvice(false);
            selectEmotion(undefined); // 感情選択をリセット

            // 体験済みのシナリオの場合はセッション上書き保存＆終了
            if (
              roleplayState.selectedScenario &&
              isExperiencedScenario(roleplayState.selectedScenario)
            ) {
              console.log('=== 体験済みシナリオのセッション完了 ===');
              console.log('selectedScenario:', roleplayState.selectedScenario);
              console.log('currentSessionId:', roleplayState.currentSessionId);
              try {
                await completeSession();
                console.log('セッション完了処理完了');
              } catch (error) {
                console.error('Failed to complete session:', error);
              }

              // シナリオ選択画面に戻る
              setStep('list');
            } else {
              console.log('=== 初回体験シナリオ ===');
              console.log('selectedScenario:', roleplayState.selectedScenario);
              console.log(
                'isExperienced:',
                roleplayState.selectedScenario
                  ? isExperiencedScenario(roleplayState.selectedScenario)
                  : false,
              );

              // 初回体験の場合もセッション完了
              try {
                await completeSession();
                console.log('初回体験: セッション完了処理完了');

                // シナリオ選択画面に戻る
                setStep('list');
              } catch (error) {
                console.error('Failed to complete session:', error);
              }
            }
          }}
        >
          {selectedEmotion && (
            <div
              style={{
                textAlign: 'center',
                width: '100%',
                position: 'relative',
              }}
            >
              {/* ロールプレイを終了するボタン（右上） */}
              <button
                onClick={async () => {
                  setShowAdvice(false);
                  selectEmotion(undefined); // 感情選択をリセット

                  // セッション完了
                  try {
                    await completeSession();
                    console.log('ロールプレイ終了: セッション完了処理完了');
                  } catch (error) {
                    console.error('Failed to complete session:', error);
                  }

                  // シナリオ選択画面に戻る
                  setStep('list');
                }}
                style={{
                  position: 'absolute',
                  top: spacing.sm,
                  right: spacing.sm,
                  padding: `${spacing.sm} ${spacing.md}`,
                  fontSize: 'clamp(12px, 3vw, 16px)',
                  border: 'none',
                  borderRadius: borderRadius.button,
                  backgroundColor: selectedScenario?.color || colors.primary,
                  color: colors.text.white,
                  cursor: 'pointer',
                  fontWeight: '600',
                  boxShadow: colors.shadow.light,
                  zIndex: 1,
                }}
              >
                おわり
              </button>

              <h2>えらんだきもち</h2>

              <div
                style={{
                  display: 'inline-block',
                  background: colors.background.white,
                  border: `3px solid ${selectedEmotion.color}`,
                  borderRadius: borderRadius.large,
                  padding: spacing.md,
                  boxShadow: colors.shadow.menu,
                }}
              >
                <img
                  src={selectedEmotion.image_url}
                  alt={selectedEmotion.label}
                  width={80}
                />
                <p
                  style={{
                    fontWeight: 'bold',
                    color: selectedEmotion.color,
                    marginTop: spacing.sm,
                  }}
                >
                  {selectedEmotion.label}
                </p>
              </div>

              {/* ほかのきもちをせんたくするボタン（感情カードの下） */}
              <button
                onClick={() => {
                  setShowAdvice(false);
                  selectEmotion(undefined); // 感情選択をリセット
                }}
                style={{
                  marginTop: spacing.lg,
                  padding: `${spacing.md} ${spacing.lg}`,
                  fontSize: 'clamp(14px, 3.5vw, 18px)',
                  border: 'none',
                  borderRadius: borderRadius.button,
                  backgroundColor: selectedScenario?.color || colors.primary,
                  color: colors.text.white,
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '300px',
                  fontWeight: '600',
                  boxShadow: colors.shadow.light,
                }}
              >
                🔄 ほかのきもちをせんたくする
              </button>

              {/* 共通の声かけ */}
              <p
                style={{
                  marginTop: spacing.lg,
                  fontSize: 'clamp(16px, 4vw, 24px)',
                  whiteSpace: 'pre-line',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  padding: '0 10px',
                }}
              >
                {`そうだね。${getEmotionPhrase(selectedEmotion)}なんだね。
じゃあ、なかよく あそぶには
どうしたらいいかな？
ぱぱやままと いっしょに
かんがえてみよう！`}
              </p>

              {/* トグルボタン */}
              <button
                onClick={() => setShowAdvice((prev) => !prev)}
                style={{
                  marginTop: spacing.lg,
                  padding: `${spacing.xl} ${spacing.xl}`,
                  fontSize: fontSize.xl,
                  border: 'none',
                  borderRadius: borderRadius.button,
                  backgroundColor: showAdvice ? colors.primary : 'transparent',
                  backgroundImage: showAdvice
                    ? 'none'
                    : 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)',
                  backgroundSize: '400% 400%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  color: colors.text.white,
                  cursor: 'pointer',
                  fontWeight: '700',
                  boxShadow: colors.shadow.light,
                  transition: 'all 0.3s ease',
                  animation: showAdvice
                    ? 'none'
                    : 'rainbowShift 3s ease-in-out infinite',
                }}
              >
                {showAdvice ? 'とじる' : '🪄こころんのおまじない'}
              </button>

              {/* アドバイス表示 */}
              {showAdvice && (
                <div
                  style={{
                    marginTop: spacing.lg,
                    background: colors.background.light,
                    padding: `${spacing.md} ${spacing.lg}`,
                    borderRadius: borderRadius.button,
                    maxWidth: '260px',
                    fontSize: fontSize.large,
                    boxShadow: colors.shadow.light,
                    margin: '0 auto',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {adviceLoading
                    ? 'アドバイスを読み込み中...'
                    : advice
                      ? advice.advice_text
                      : `アドバイスが見つかりませんでした (シナリオ: ${roleplayState.selectedScenario}, 感情: ${roleplayState.selectedEmotion})`}
                </div>
              )}

              {/* こころん（中央下） */}
              <div
                style={{
                  marginTop: spacing.lg,
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <KokoronDefault size={120} />
              </div>
            </div>
          )}
        </RoleplayModal>
      </div>
    );
  }

  return null;
}
