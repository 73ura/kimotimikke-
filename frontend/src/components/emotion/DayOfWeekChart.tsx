'use client';

import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import React from 'react';
import { Pie } from 'react-chartjs-2';

// Chart.jsのコンポーネントを登録
ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

interface EmotionFrequency {
  emotion_id: string;
  emotion_label: string;
  count: number;
  percentage: number;
  color: string;
}

interface DayOfWeekPattern {
  day_of_week: string;
  emotion_frequencies: EmotionFrequency[];
  total_records: number;
  avg_intensity: number;
  dominant_emotion: string;
  dominant_emotion_percentage: number;
}

interface DayOfWeekChartProps {
  patterns: DayOfWeekPattern[];
}

const DayOfWeekChart: React.FC<DayOfWeekChartProps> = ({ patterns }) => {
  if (!patterns || patterns.length === 0) {
    return null;
  }

  // 各曜日の円グラフデータを生成
  const chartData = patterns.map((pattern) => {
    const data = {
      labels: pattern.emotion_frequencies.map(
        (emotion) => emotion.emotion_label,
      ),
      datasets: [
        {
          data: pattern.emotion_frequencies.map(
            (emotion) => emotion.percentage,
          ),
          backgroundColor: pattern.emotion_frequencies.map(
            (emotion) => emotion.color,
          ),
          borderColor: pattern.emotion_frequencies.map(
            (emotion) => emotion.color,
          ),
          borderWidth: 2,
        },
      ],
    };

    return {
      day: pattern.day_of_week,
      data,
      totalRecords: pattern.total_records,
      dominantEmotion: pattern.dominant_emotion,
      dominantPercentage: pattern.dominant_emotion_percentage,
    };
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // 個別の凡例は非表示
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value}%`;
          },
        },
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: {
          weight: 'bold' as const,
          size: 12,
        },
        formatter: (value: number, context: any) => {
          if (value < 10) return ''; // 10%未満はラベルを表示しない
          return context.chart.data.labels[context.dataIndex];
        },
      },
    },
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {chartData.map((chart, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '16px',
              border: '2px solid #e5e7eb',
              textAlign: 'center',
            }}
          >
            {/* 曜日名 */}
            <h4
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#374151',
              }}
            >
              {chart.day}
            </h4>

            {/* 円グラフ */}
            <div style={{ height: '120px', marginBottom: '12px' }}>
              <Pie data={chart.data} options={chartOptions} />
            </div>

            {/* 記録数 */}
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '8px',
              }}
            >
              {chart.totalRecords}件の記録
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayOfWeekChart;
