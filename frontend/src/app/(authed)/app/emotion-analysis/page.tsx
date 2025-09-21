'use client';

import {
  HamburgerMenu,
  KokoronDefault,
  SpeechBubble,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/hooks/useChildren';
import { useEmotionAnalysis } from '@/hooks/useEmotionAnalysis';
import { borderRadius, colors, fontSize, spacing } from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EmotionAnalysisPage() {
  const { firebaseUser, isLoading: authLoading } = useAuth();
  const { children, loading: childrenLoading } = useChildren();
  const router = useRouter();

  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [analysisDays, setAnalysisDays] = useState<number>(30);

  const { analysis, loading, error, refetch } = useEmotionAnalysis(
    selectedChildId || undefined,
    analysisDays,
  );

  const handleBack = () => {
    router.push('/app');
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
  };

  const handleDaysChange = (days: number) => {
    setAnalysisDays(days);
  };

  // ローディング中
  if (authLoading || childrenLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: colors.background.gradient,
        }}
      >
        <Spinner size="medium" />
        <p style={{ color: colors.text.primary, marginTop: spacing.md }}>
          読み込み中...
        </p>
      </div>
    );
  }

  // 認証されていない場合
  if (!firebaseUser) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: colors.background.gradient,
        }}
      >
        <p style={{ color: colors.text.primary }}>認証が必要です</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background.gradient,
        padding: spacing.lg,
      }}
    >
      <HamburgerMenu />

      {/* 戻るボタン */}
      <p
        onClick={handleBack}
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

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '800px',
          margin: '0 auto',
          paddingTop: spacing.xxl,
        }}
      >
        {/* ヘッダー */}
        <SpeechBubble text="お子さんの感情パターンを分析して、フィードバックをお届けします！" />

        <div style={{ margin: `${spacing.lg} 0` }}>
          <KokoronDefault size={200} />
        </div>

        {/* 子供選択 */}
        {children.length > 0 && (
          <div
            style={{
              backgroundColor: colors.background.white,
              borderRadius: borderRadius.large,
              padding: spacing.xl,
              boxShadow: colors.shadow.heavy,
              width: '100%',
              marginBottom: spacing.lg,
            }}
          >
            <h2
              style={{
                color: colors.text.primary,
                fontSize: fontSize.xl,
                fontWeight: 'bold',
                marginBottom: spacing.lg,
                textAlign: 'center',
              }}
            >
              分析するお子さんを選択
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.md,
              }}
            >
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child.id)}
                  style={{
                    backgroundColor:
                      selectedChildId === child.id
                        ? colors.primary
                        : colors.background.light,
                    color:
                      selectedChildId === child.id
                        ? colors.text.white
                        : colors.text.primary,
                    border: `2px solid ${colors.primary}`,
                    borderRadius: borderRadius.medium,
                    padding: spacing.lg,
                    fontSize: fontSize.large,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {child.nickname}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 期間選択 */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: borderRadius.large,
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            width: '100%',
            marginBottom: spacing.lg,
          }}
        >
          <h2
            style={{
              color: colors.text.primary,
              fontSize: fontSize.xl,
              fontWeight: 'bold',
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}
          >
            分析期間を選択
          </h2>

          <div
            style={{
              display: 'flex',
              gap: spacing.md,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[7, 14, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => handleDaysChange(days)}
                style={{
                  backgroundColor:
                    analysisDays === days
                      ? colors.primary
                      : colors.background.light,
                  color:
                    analysisDays === days
                      ? colors.text.white
                      : colors.text.primary,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: borderRadius.medium,
                  padding: `${spacing.md} ${spacing.lg}`,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                過去{days}日間
              </button>
            ))}
          </div>
        </div>

        {/* 分析結果表示 */}
        {selectedChildId && (
          <div
            style={{
              backgroundColor: colors.background.white,
              borderRadius: borderRadius.large,
              padding: spacing.xl,
              boxShadow: colors.shadow.heavy,
              width: '100%',
            }}
          >
            {loading && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: spacing.xxl,
                }}
              >
                <Spinner size="medium" />
                <p
                  style={{ color: colors.text.primary, marginTop: spacing.md }}
                >
                  分析中...
                </p>
              </div>
            )}

            {error && (
              <div
                style={{
                  textAlign: 'center',
                  padding: spacing.xl,
                }}
              >
                <p
                  style={{ color: colors.text.error, fontSize: fontSize.large }}
                >
                  エラー: {error}
                </p>
                <button
                  onClick={refetch}
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.text.white,
                    border: 'none',
                    borderRadius: borderRadius.medium,
                    padding: `${spacing.md} ${spacing.lg}`,
                    fontSize: fontSize.base,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: spacing.md,
                  }}
                >
                  再試行
                </button>
              </div>
            )}

            {analysis && !loading && (
              <div>
                <h2
                  style={{
                    color: colors.text.primary,
                    fontSize: fontSize.xl,
                    fontWeight: 'bold',
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                  }}
                >
                  {analysis.child_name}さんの感情分析結果
                </h2>

                <div
                  style={{
                    backgroundColor: colors.background.light,
                    borderRadius: borderRadius.medium,
                    padding: spacing.lg,
                    marginBottom: spacing.lg,
                  }}
                >
                  <p
                    style={{
                      color: colors.text.primary,
                      fontSize: fontSize.base,
                      margin: 0,
                      textAlign: 'center',
                    }}
                  >
                    {analysis.analysis_period} • {analysis.total_records}
                    件の記録を分析
                  </p>
                </div>

                {/* フィードバック表示 */}
                <div
                  style={{
                    backgroundColor: colors.background.light,
                    borderRadius: borderRadius.medium,
                    padding: spacing.lg,
                    marginBottom: spacing.lg,
                  }}
                >
                  <h3
                    style={{
                      color: colors.text.primary,
                      fontSize: fontSize.large,
                      fontWeight: 'bold',
                      marginBottom: spacing.md,
                    }}
                  >
                    フィードバック
                  </h3>
                  <p
                    style={{
                      color: colors.text.primary,
                      fontSize: fontSize.base,
                      lineHeight: 1.6,
                      marginBottom: spacing.md,
                    }}
                  >
                    {analysis.feedback.summary}
                  </p>

                  {analysis.feedback.insights.length > 0 && (
                    <div style={{ marginBottom: spacing.md }}>
                      <h4
                        style={{
                          color: colors.text.primary,
                          fontSize: fontSize.base,
                          fontWeight: 'bold',
                          marginBottom: spacing.sm,
                        }}
                      >
                        気づき
                      </h4>
                      <ul
                        style={{
                          color: colors.text.primary,
                          fontSize: fontSize.small,
                          paddingLeft: spacing.lg,
                          margin: 0,
                        }}
                      >
                        {analysis.feedback.insights.map((insight, index) => (
                          <li key={index} style={{ marginBottom: spacing.xs }}>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.feedback.recommendations.length > 0 && (
                    <div>
                      <h4
                        style={{
                          color: colors.text.primary,
                          fontSize: fontSize.base,
                          fontWeight: 'bold',
                          marginBottom: spacing.sm,
                        }}
                      >
                        おすすめ
                      </h4>
                      <ul
                        style={{
                          color: colors.text.primary,
                          fontSize: fontSize.small,
                          paddingLeft: spacing.lg,
                          margin: 0,
                        }}
                      >
                        {analysis.feedback.recommendations.map(
                          (recommendation, index) => (
                            <li
                              key={index}
                              style={{ marginBottom: spacing.xs }}
                            >
                              {recommendation}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 感情頻度グラフ（簡易版） */}
                {analysis.emotion_frequencies.length > 0 && (
                  <div
                    style={{
                      backgroundColor: colors.background.light,
                      borderRadius: borderRadius.medium,
                      padding: spacing.lg,
                      marginBottom: spacing.lg,
                    }}
                  >
                    <h3
                      style={{
                        color: colors.text.primary,
                        fontSize: fontSize.large,
                        fontWeight: 'bold',
                        marginBottom: spacing.md,
                      }}
                    >
                      感情の分布
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing.sm,
                      }}
                    >
                      {analysis.emotion_frequencies
                        .slice(0, 5)
                        .map((emotion) => (
                          <div
                            key={emotion.emotion_id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing.sm,
                            }}
                          >
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: emotion.color,
                                borderRadius: '50%',
                              }}
                            />
                            <span
                              style={{
                                color: colors.text.primary,
                                fontSize: fontSize.base,
                                flex: 1,
                              }}
                            >
                              {emotion.emotion_label}
                            </span>
                            <span
                              style={{
                                color: colors.text.secondary,
                                fontSize: fontSize.small,
                              }}
                            >
                              {emotion.percentage}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
