"""
感情パターン分析サービス

感情記録を分析して、親にフィードバックを提供するためのサービス
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from collections import defaultdict, Counter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.models import EmotionLog, EmotionCard, Child, Intensity
from app.services.voice_text_analysis import VoiceTextAnalysisService
from app.schemas import (
    EmotionAnalysisResponse,
    EmotionFrequency,
    IntensityDistribution,
    WeeklyPattern,
    EmotionTrend,
    ParentFeedback,
    VoiceTextAnalysis,
    DayOfWeekPattern,
)

logger = logging.getLogger(__name__)


class EmotionAnalysisService:
    """感情パターン分析サービス"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def analyze_emotion_patterns(
        self, 
        child_id: str, 
        user_id: str, 
        days: int = 30
    ) -> EmotionAnalysisResponse:
        """
        感情パターンを分析して親向けフィードバックを生成
        
        Args:
            child_id: 子供のID
            user_id: ユーザーID
            days: 分析期間（日数）
            
        Returns:
            EmotionAnalysisResponse: 分析結果
        """
        try:
            # 分析期間の計算
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # 子供情報を取得
            child = await self._get_child_info(child_id, user_id)
            if not child:
                raise ValueError(f"Child not found: {child_id}")
            
            # 感情記録を取得
            emotion_logs = await self._get_emotion_logs(child_id, user_id, start_date, end_date)
            
            if not emotion_logs:
                return self._create_empty_analysis(child_id, child.nickname, days)
            
            # 基本統計を計算
            emotion_frequencies = await self._calculate_emotion_frequencies(emotion_logs)
            intensity_distribution = await self._calculate_intensity_distribution(emotion_logs)
            
            # パターン分析
            weekly_patterns = await self._analyze_weekly_patterns(emotion_logs)
            emotion_trends = await self._analyze_emotion_trends(emotion_logs, days)
            
            # 親向けフィードバック生成
            feedback = await self._generate_parent_feedback(
                emotion_frequencies, 
                intensity_distribution,
                weekly_patterns,
                emotion_trends,
                len(emotion_logs)
            )
            
            # 音声テキスト分析を実行
            voice_analysis_service = VoiceTextAnalysisService(self.db)
            voice_analysis_result = await voice_analysis_service.analyze_voice_notes(
                child_id, user_id, days
            )
            voice_analysis = VoiceTextAnalysis(**voice_analysis_result)
            
            # 曜日パターン分析を実行
            day_of_week_patterns = await self._analyze_day_of_week_patterns(emotion_logs)
            
            # 信頼度スコア計算
            confidence_score = self._calculate_confidence_score(len(emotion_logs), days)
            
            return EmotionAnalysisResponse(
                child_id=child_id,
                child_name=child.nickname,
                analysis_period=f"過去{days}日間",
                total_records=len(emotion_logs),
                emotion_frequencies=emotion_frequencies,
                intensity_distribution=intensity_distribution,
                weekly_patterns=weekly_patterns,
                emotion_trends=emotion_trends,
                feedback=feedback,
                voice_analysis=voice_analysis,
                day_of_week_patterns=day_of_week_patterns,
                analysis_date=end_date.strftime("%Y-%m-%d"),
                confidence_score=confidence_score
            )
            
        except Exception as e:
            logger.error(f"感情パターン分析エラー: {e}", exc_info=True)
            raise

    async def _get_child_info(self, child_id: str, user_id: str) -> Child | None:
        """子供情報を取得"""
        result = await self.db.execute(
            select(Child).where(
                and_(
                    Child.id == child_id,
                    Child.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def _get_emotion_logs(
        self, 
        child_id: str, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[EmotionLog]:
        """感情記録を取得"""
        result = await self.db.execute(
            select(EmotionLog)
            .options(
                selectinload(EmotionLog.emotion_card),
                selectinload(EmotionLog.intensity)
            )
            .where(
                and_(
                    EmotionLog.child_id == child_id,
                    EmotionLog.user_id == user_id,
                    EmotionLog.created_at >= start_date,
                    EmotionLog.created_at <= end_date
                )
            )
            .order_by(EmotionLog.created_at)
        )
        return result.scalars().all()

    async def _calculate_emotion_frequencies(
        self, 
        emotion_logs: List[EmotionLog]
    ) -> List[EmotionFrequency]:
        """感情の頻度を計算"""
        emotion_counts = Counter()
        total_logs = len(emotion_logs)
        
        for log in emotion_logs:
            emotion_id = str(log.emotion_card.id)
            emotion_counts[emotion_id] += 1
        
        frequencies = []
        for emotion_id, count in emotion_counts.items():
            # 感情カード情報を取得
            emotion_card = next(
                (log.emotion_card for log in emotion_logs if str(log.emotion_card.id) == emotion_id),
                None
            )
            
            if emotion_card:
                frequencies.append(EmotionFrequency(
                    emotion_id=emotion_id,
                    emotion_label=emotion_card.label,
                    count=count,
                    percentage=round((count / total_logs) * 100, 1),
                    color=emotion_card.color
                ))
        
        return sorted(frequencies, key=lambda x: x.count, reverse=True)

    async def _calculate_intensity_distribution(
        self, 
        emotion_logs: List[EmotionLog]
    ) -> List[IntensityDistribution]:
        """強度分布を計算"""
        intensity_counts = Counter()
        total_logs = len(emotion_logs)
        
        for log in emotion_logs:
            intensity_counts[log.intensity_id] += 1
        
        distributions = []
        for intensity_id, count in intensity_counts.items():
            distributions.append(IntensityDistribution(
                intensity_id=intensity_id,
                count=count,
                percentage=round((count / total_logs) * 100, 1)
            ))
        
        return sorted(distributions, key=lambda x: x.intensity_id)


    async def _analyze_weekly_patterns(
        self, 
        emotion_logs: List[EmotionLog]
    ) -> List[WeeklyPattern]:
        """週間パターンを分析"""
        daily_emotions = defaultdict(lambda: defaultdict(int))
        
        for log in emotion_logs:
            day_of_week = log.created_at.weekday()  # 0=月曜日, 6=日曜日
            emotion_id = str(log.emotion_card.id)
            daily_emotions[day_of_week][emotion_id] += 1
        
        weekly_patterns = []
        for day in range(7):
            emotion_counts = dict(daily_emotions[day])
            weekly_patterns.append(WeeklyPattern(
                day_of_week=day,
                emotion_counts=emotion_counts
            ))
        
        return weekly_patterns

    async def _analyze_emotion_trends(
        self, 
        emotion_logs: List[EmotionLog], 
        days: int
    ) -> List[EmotionTrend]:
        """感情のトレンドを分析"""
        # 期間を前半と後半に分割
        mid_point = len(emotion_logs) // 2
        first_half = emotion_logs[:mid_point]
        second_half = emotion_logs[mid_point:]
        
        # 各感情の出現回数を計算
        first_half_counts = Counter(str(log.emotion_card.id) for log in first_half)
        second_half_counts = Counter(str(log.emotion_card.id) for log in second_half)
        
        # 感情カード情報を取得
        emotion_cards = {str(log.emotion_card.id): log.emotion_card for log in emotion_logs}
        
        trends = []
        all_emotions = set(first_half_counts.keys()) | set(second_half_counts.keys())
        
        for emotion_id in all_emotions:
            first_count = first_half_counts[emotion_id]
            second_count = second_half_counts[emotion_id]
            
            # 変化率を計算
            if first_count > 0:
                change_percentage = ((second_count - first_count) / first_count) * 100
            else:
                change_percentage = 100.0 if second_count > 0 else 0.0
            
            # トレンドを判定
            if change_percentage > 20:
                trend = "increasing"
            elif change_percentage < -20:
                trend = "decreasing"
            else:
                trend = "stable"
            
            emotion_card = emotion_cards[emotion_id]
            trends.append(EmotionTrend(
                emotion_id=emotion_id,
                emotion_label=emotion_card.label,
                trend=trend,
                change_percentage=round(change_percentage, 1)
            ))
        
        return trends

    async def _generate_parent_feedback(
        self,
        emotion_frequencies: List[EmotionFrequency],
        intensity_distribution: List[IntensityDistribution],
        weekly_patterns: List[WeeklyPattern],
        emotion_trends: List[EmotionTrend],
        total_records: int
    ) -> ParentFeedback:
        """親向けフィードバックを生成"""
        insights = []
        recommendations = []
        positive_aspects = []
        areas_for_attention = []
        
        # 最も多い感情を分析
        if emotion_frequencies:
            top_emotion = emotion_frequencies[0]
            insights.append(f"最も多く記録された感情は「{top_emotion.emotion_label}」です（{top_emotion.percentage}%）")
            
            # 感情の分類
            positive_emotions = ["うれしい", "たのしい", "わくわく", "きんちょう", "どきどき", "はりきって"]
            neutral_emotions = ["ふつう", "へいき", "おだやか"]
            challenging_emotions = ["かなしい", "おこっている", "こわい", "いらいら", "しんぱい", "つかれている"]
            
            if any(emotion in top_emotion.emotion_label for emotion in positive_emotions):
                positive_aspects.append(f"「{top_emotion.emotion_label}」の感情が多く見られ、お子さんは前向きな気持ちで過ごしているようです")
                recommendations.append("お子さんの前向きな気持ちを大切に、その感情を共有してあげてください")
            elif any(emotion in top_emotion.emotion_label for emotion in neutral_emotions):
                insights.append("お子さんは落ち着いた気持ちで過ごしているようです")
            elif any(emotion in top_emotion.emotion_label for emotion in challenging_emotions):
                areas_for_attention.append(f"「{top_emotion.emotion_label}」の感情が多く記録されています")
                recommendations.append("お子さんが感じている気持ちに寄り添い、安心できる環境を作ってあげてください")
        
        # 強度分布を分析
        high_intensity_count = sum(d.count for d in intensity_distribution if d.intensity_id >= 3)
        low_intensity_count = sum(d.count for d in intensity_distribution if d.intensity_id == 1)
        
        if high_intensity_count > 0:
            high_intensity_percentage = (high_intensity_count / total_records) * 100
            if high_intensity_percentage > 50:
                insights.append(f"感情の強度が高い記録が{high_intensity_percentage:.1f}%を占めています")
                recommendations.append("感情が高ぶっている時は、深呼吸や静かな時間を作ってあげてください")
            elif high_intensity_percentage > 30:
                insights.append(f"時々感情が高ぶることがあります（{high_intensity_percentage:.1f}%）")
                recommendations.append("感情の変化に気づいたら、お子さんと一緒に気持ちを整理してみてください")
        
        if low_intensity_count > 0:
            low_intensity_percentage = (low_intensity_count / total_records) * 100
            if low_intensity_percentage > 60:
                insights.append("お子さんは比較的落ち着いた感情で過ごしているようです")
                positive_aspects.append("感情の起伏が少なく、安定した気持ちで過ごせているようです")
        
        
        # 週間パターンを分析
        weekday_emotions = sum(sum(pattern.emotion_counts.values()) for pattern in weekly_patterns[:5])
        weekend_emotions = sum(sum(pattern.emotion_counts.values()) for pattern in weekly_patterns[5:])
        
        if weekday_emotions > 0 and weekend_emotions > 0:
            if weekday_emotions > weekend_emotions * 1.5:
                insights.append("平日により多くの感情記録があります")
                recommendations.append("平日の生活リズムがお子さんの感情に影響している可能性があります。学校や習い事での出来事を聞いてみてください")
            elif weekend_emotions > weekday_emotions * 1.5:
                insights.append("週末により多くの感情記録があります")
                recommendations.append("週末の時間を大切に、家族との時間でお子さんの気持ちを確認してみてください")
            else:
                insights.append("平日と週末で感情記録のバランスが取れています")
        
        # トレンドを分析
        increasing_emotions = [t for t in emotion_trends if t.trend == "increasing"]
        decreasing_emotions = [t for t in emotion_trends if t.trend == "decreasing"]
        
        if increasing_emotions:
            emotion_names = [e.emotion_label for e in increasing_emotions[:3]]
            insights.append(f"「{', '.join(emotion_names)}」の感情が増加傾向にあります")
        
        if decreasing_emotions:
            emotion_names = [e.emotion_label for e in decreasing_emotions[:3]]
            insights.append(f"「{', '.join(emotion_names)}」の感情が減少傾向にあります")
        
        # サマリー生成
        summary = f"お子さんの感情記録を{total_records}件分析しました。"
        if positive_aspects:
            summary += f" {positive_aspects[0]}"
        if areas_for_attention:
            summary += f" {areas_for_attention[0]}"
        
        return ParentFeedback(
            summary=summary,
            insights=insights[:5],  # 最大5件
            recommendations=recommendations[:5],  # 最大5件
            positive_aspects=positive_aspects[:3],  # 最大3件
            areas_for_attention=areas_for_attention[:3]  # 最大3件
        )

    async def _analyze_day_of_week_patterns(self, emotion_logs: List[EmotionLog]) -> List[DayOfWeekPattern]:
        """曜日パターン分析"""
        if not emotion_logs:
            return []
        
        # 曜日名のマッピング
        day_names = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日"]
        
        # 曜日別にデータをグループ化（JST変換）
        from zoneinfo import ZoneInfo
        
        day_groups = {}
        for log in emotion_logs:
            # UTC時間をJSTに変換
            jst_time = log.created_at.astimezone(ZoneInfo('Asia/Tokyo'))
            day_of_week = jst_time.weekday()  # 0=月曜日, 6=日曜日
            if day_of_week not in day_groups:
                day_groups[day_of_week] = []
            day_groups[day_of_week].append(log)
        
        patterns = []
        for day_of_week, logs in day_groups.items():
            if not logs:
                continue
                
            # 感情頻度を計算
            emotion_counts = defaultdict(int)
            intensity_sum = 0
            
            for log in logs:
                emotion_counts[log.emotion_card.label] += 1
                intensity_sum += log.intensity.id  # idが強度レベルを表す
            
            # 感情頻度データを作成
            total_records = len(logs)
            emotion_frequencies = []
            for emotion_label, count in emotion_counts.items():
                # 実際の感情カードの色を取得
                emotion_card = None
                for log in logs:
                    if log.emotion_card.label == emotion_label:
                        emotion_card = log.emotion_card
                        break
                
                color = emotion_card.color if emotion_card else "#FF6B6B"
                
                emotion_frequencies.append(EmotionFrequency(
                    emotion_id=str(hash(emotion_label)),  # 簡易ID生成
                    emotion_label=emotion_label,
                    count=count,
                    percentage=round(count / total_records * 100, 1),
                    color=color
                ))
            
            # 感情頻度でソート
            emotion_frequencies.sort(key=lambda x: x.count, reverse=True)
            
            # 平均強度を計算
            avg_intensity = round(intensity_sum / total_records, 1)
            
            # 支配的感情を取得
            dominant_emotion = emotion_frequencies[0].emotion_label if emotion_frequencies else "不明"
            dominant_emotion_percentage = emotion_frequencies[0].percentage if emotion_frequencies else 0.0
            
            patterns.append(DayOfWeekPattern(
                day_of_week=day_names[day_of_week],
                emotion_frequencies=emotion_frequencies,
                total_records=total_records,
                avg_intensity=avg_intensity,
                dominant_emotion=dominant_emotion,
                dominant_emotion_percentage=dominant_emotion_percentage
            ))
        
        # 曜日順にソート（月曜日から日曜日）
        patterns.sort(key=lambda x: day_names.index(x.day_of_week))
        
        return patterns

    def _calculate_confidence_score(self, record_count: int, days: int) -> float:
        """分析の信頼度スコアを計算"""
        # 記録数と期間に基づいて信頼度を計算
        expected_records = days * 0.5  # 1日0.5件の記録を期待
        if record_count >= expected_records:
            return min(1.0, record_count / expected_records)
        else:
            return max(0.1, record_count / expected_records)

    def _create_empty_analysis(
        self, 
        child_id: str, 
        child_name: str, 
        days: int
    ) -> EmotionAnalysisResponse:
        """記録がない場合の空の分析結果を作成"""
        return EmotionAnalysisResponse(
            child_id=child_id,
            child_name=child_name,
            analysis_period=f"過去{days}日間",
            total_records=0,
                emotion_frequencies=[],
                intensity_distribution=[],
                weekly_patterns=[],
                emotion_trends=[],
            feedback=ParentFeedback(
                summary=f"過去{days}日間の感情記録が見つかりませんでした。",
                insights=["感情記録を始めてみましょう"],
                recommendations=["毎日の感情を記録することで、お子さんの気持ちを理解できます"],
                positive_aspects=[],
                areas_for_attention=[]
            ),
            analysis_date=datetime.now().strftime("%Y-%m-%d"),
            confidence_score=0.0
        )
