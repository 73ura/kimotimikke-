import { HamburgerMenu } from '@/components/ui';
import {
  borderRadius,
  colors,
  commonStyles,
  fontSize,
  spacing,
} from '@/styles/theme';

export default function EmotionAnalysisGuidePage() {
  return (
    <div
      style={{
        ...commonStyles.page.container,
        backgroundImage: 'url(/images/background.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        padding: spacing.md,
        minHeight: '100vh',
        overflow: 'auto',
      }}
    >
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />

      <div style={commonStyles.page.mainContent}>
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: borderRadius.large,
            padding: spacing.lg,
            boxShadow: colors.shadow.heavy,
            maxWidth: '70vw',
            width: '80vw',
            margin: '0 auto',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <h1
            style={{
              color: colors.text.primary,
              fontSize: fontSize.xl,
              fontWeight: 'bold',
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}
          >
            感情分析ガイド
          </h1>

          <div style={{ marginBottom: spacing.lg }}>
            <h2
              style={{
                color: colors.text.primary,
                fontSize: fontSize.large,
                fontWeight: 'bold',
                marginBottom: spacing.sm,
                borderBottom: `2px solid ${colors.primary}`,
                paddingBottom: spacing.xs,
              }}
            >
              📊 感情分析の見方
            </h2>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                分析期間について
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                感情分析は過去30日間、60日間、90日間の期間で行います。期間が長いほど、より安定した分析結果が得られます。
              </p>
              <div
                style={{
                  backgroundColor: '#f0f8ff',
                  padding: spacing.sm,
                  borderRadius: borderRadius.small,
                  marginTop: spacing.sm,
                  border: `1px solid ${colors.primary}`,
                }}
              >
                <p
                  style={{
                    color: colors.text.primary,
                    fontSize: fontSize.small,
                    lineHeight: 1.5,
                    margin: 0,
                    fontWeight: 'bold',
                  }}
                >
                  📅 期間の計算方法
                </p>
                <p
                  style={{
                    color: colors.text.secondary,
                    fontSize: fontSize.small,
                    lineHeight: 1.5,
                    margin: `${spacing.xs} 0 0 0`,
                  }}
                >
                  今日から遡って指定した日数分の期間で分析します。
                </p>
                <ul
                  style={{
                    color: colors.text.secondary,
                    fontSize: fontSize.small,
                    lineHeight: 1.5,
                    margin: `${spacing.xs} 0 0 0`,
                    paddingLeft: spacing.md,
                  }}
                >
                  <li>
                    <strong>30日間</strong> → 今日から30日前まで
                  </li>
                  <li>
                    <strong>60日間</strong> → 今日から60日前まで
                  </li>
                  <li>
                    <strong>90日間</strong> → 今日から90日前まで
                  </li>
                </ul>
                <p
                  style={{
                    color: colors.text.secondary,
                    fontSize: fontSize.small,
                    lineHeight: 1.5,
                    margin: `${spacing.xs} 0 0 0`,
                    fontStyle: 'italic',
                  }}
                >
                  例：今日が12月15日の場合、30日間を選ぶと11月15日〜12月15日の記録を分析
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                感情の分布グラフ
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                最も多く記録された感情が上位5つまで表示されます。色のついた丸は感情の色を表し、パーセンテージはその感情が記録された割合を示します。
              </p>
            </div>
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <h2
              style={{
                color: colors.text.primary,
                fontSize: fontSize.large,
                fontWeight: 'bold',
                marginBottom: spacing.sm,
                borderBottom: `2px solid ${colors.primary}`,
                paddingBottom: spacing.xs,
              }}
            >
              💡 フィードバックの読み方
            </h2>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                気づき（Insights）
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                お子さんの感情パターンから発見された特徴的な傾向や変化を教えてくれます。感情の頻度、強度、週間パターン、トレンドなどが含まれます。
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                おすすめ（Recommendations）
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                気づきに基づいて、お子さんとの関わり方や環境づくりのための具体的なアドバイスを提供します。実践しやすい内容になっています。
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                ポジティブな側面
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                お子さんの良い点や前向きな感情パターンを指摘します。お子さんの成長や良い変化を認識するのに役立ちます。
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                注意すべき点
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                お子さんの感情パターンで気をつけて見守るべき点を教えてくれます。心配な感情が多く記録されている場合などに表示されます。
              </p>
            </div>
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <h2
              style={{
                color: colors.text.primary,
                fontSize: fontSize.large,
                fontWeight: 'bold',
                marginBottom: spacing.sm,
                borderBottom: `2px solid ${colors.primary}`,
                paddingBottom: spacing.xs,
              }}
            >
              🔄 分析結果の更新について
            </h2>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                キャッシュ機能
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                分析結果は24時間キャッシュされます。同じ期間の分析を再度行う場合は、保存された結果が表示されるため、一貫した結果を確認できます。
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                最終更新時間について
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                「最終更新」時間は、分析結果を取得した時刻を指します。ページを開いた時や期間を変更した時に表示されます。キャッシュ機能は「最終更新」時間から起算して、24時間保持されます。
              </p>
              <div
                style={{
                  backgroundColor: '#fff3cd',
                  padding: spacing.sm,
                  borderRadius: borderRadius.small,
                  marginTop: spacing.sm,
                  border: '1px solid #ffeaa7',
                }}
              >
                <p
                  style={{
                    color: colors.text.primary,
                    fontSize: fontSize.small,
                    lineHeight: 1.5,
                    margin: 0,
                    fontWeight: 'bold',
                  }}
                >
                  ⚠️ 重要な注意点
                </p>
                <p
                  style={{
                    color: colors.text.secondary,
                    fontSize: fontSize.small,
                    lineHeight: 1.5,
                    margin: `${spacing.xs} 0 0 0`,
                  }}
                >
                  24時間経過後は、ページを開くと自動的に新しい分析が実行され、データが更新されます。
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                手動更新
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                「更新」ボタンを押すことで、最新の記録を含めて分析を再実行できます。新しい記録を追加した後などに使用してください。
              </p>
            </div>
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <h2
              style={{
                color: colors.text.primary,
                fontSize: fontSize.large,
                fontWeight: 'bold',
                marginBottom: spacing.sm,
                borderBottom: `2px solid ${colors.primary}`,
                paddingBottom: spacing.xs,
              }}
            >
              💡 活用のコツ
            </h2>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                定期的な確認
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                週に1回程度、感情分析を確認する習慣をつけましょう。お子さんの感情の変化や成長を継続的に把握できます。
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                子どもとの対話
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                分析結果を子どもと一緒に見て、その期間の出来事について話し合ってみましょう。子どもの感情理解が深まります。
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: spacing.sm,
                borderRadius: borderRadius.medium,
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs,
                }}
              >
                記録の継続
              </h3>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.small,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                より正確な分析のため、毎日の感情記録を継続することが大切です。記録が多いほど、より詳細で有用な分析結果が得られます。
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: colors.primary,
              color: colors.text.white,
              padding: spacing.md,
              borderRadius: borderRadius.medium,
              textAlign: 'left',
            }}
          >
            <h3
              style={{
                fontSize: fontSize.base,
                fontWeight: 'bold',
                marginBottom: spacing.xs,
              }}
            >
              感情分析を活用して、お子さんの成長をサポートしましょう！
            </h3>
            <p
              style={{
                fontSize: fontSize.small,
                margin: 0,
                opacity: 0.9,
              }}
            >
              データに基づいた客観的な視点で、お子さんの感情を理解し、より良い子育てを実践できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
