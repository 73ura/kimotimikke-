"""
音声テキスト分析サービス

音声記録のテキストからキーワード頻度、トピック分析、言語的特徴を抽出
"""
import re
import logging
from collections import Counter
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models import EmotionLog

logger = logging.getLogger(__name__)


class VoiceTextAnalysisService:
    """音声テキスト分析サービス"""

    def __init__(self, db: AsyncSession):
        self.db = db
        # 日本語のストップワード（簡易版）
        self.stop_words = {
            'の', 'に', 'は', 'を', 'が', 'で', 'と', 'も', 'から', 'まで',
            'です', 'ます', 'だ', 'である', 'です', 'ます', 'だ', 'である',
            'て', 'た', 'する', 'した', 'している', 'していた',
            'ある', 'いる', 'いる', 'いた', 'いない', 'いなかった',
            'これ', 'それ', 'あれ', 'この', 'その', 'あの',
            '私', 'あなた', '彼', '彼女', '私たち', 'みんな',
            'とても', 'すごく', 'とても', 'すごく', 'とても', 'すごく',
            'ちょっと', '少し', 'たくさん', '多い', '少ない'
        }

    async def analyze_voice_notes(
        self, 
        child_id: str, 
        user_id: str, 
        days: int = 30
    ) -> Dict[str, Any]:
        """
        音声テキストを分析
        
        Args:
            child_id: 子供のID
            user_id: ユーザーID
            days: 分析期間（日数）
            
        Returns:
            Dict[str, Any]: 分析結果
        """
        try:
            # 分析期間の計算
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # 音声記録を取得
            voice_notes = await self._get_voice_notes(child_id, user_id, start_date, end_date)
            
            if not voice_notes:
                return self._create_empty_analysis()
            
            # 分析実行
            keyword_frequency = self._analyze_keyword_frequency(voice_notes)
            topics = self._analyze_topics(voice_notes)
            language_features = self._analyze_language_features(voice_notes)
            
            return {
                "keyword_frequency": keyword_frequency,
                "topics": topics,
                "language_features": language_features,
                "total_voice_notes": len(voice_notes),
                "analysis_period": f"過去{days}日間"
            }
            
        except Exception as e:
            logger.error(f"Voice text analysis failed: {e}")
            return self._create_empty_analysis()

    async def _get_voice_notes(
        self, 
        child_id: str, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[str]:
        """音声記録を取得"""
        query = select(EmotionLog.voice_note).where(
            and_(
                EmotionLog.child_id == child_id,
                EmotionLog.user_id == user_id,
                EmotionLog.voice_note.isnot(None),
                EmotionLog.voice_note != '',
                EmotionLog.created_at >= start_date,
                EmotionLog.created_at <= end_date
            )
        )
        
        result = await self.db.execute(query)
        voice_notes = [row[0] for row in result.fetchall() if row[0]]
        return voice_notes

    def _analyze_keyword_frequency(self, voice_notes: List[str]) -> Dict[str, Any]:
        """キーワード頻度分析"""
        # 全テキストを結合
        all_text = ' '.join(voice_notes)
        
        # テキストを前処理
        processed_text = self._preprocess_text(all_text)
        
        # 単語を分割
        words = processed_text.split()
        
        # ストップワードを除去
        filtered_words = [word for word in words if word not in self.stop_words and len(word) > 1]
        
        # 頻度カウント
        word_freq = Counter(filtered_words)
        
        # 上位20語を取得
        top_words = word_freq.most_common(20)
        
        return {
            "top_keywords": [
                {"word": word, "count": count, "percentage": round(count / len(filtered_words) * 100, 1)}
                for word, count in top_words
            ],
            "total_words": len(filtered_words),
            "unique_words": len(word_freq)
        }

    def _analyze_topics(self, voice_notes: List[str]) -> Dict[str, Any]:
        """トピック分析"""
        if not voice_notes:
            return {"top_topics": [], "total_categories": 0}
        
        # 全テキストを結合
        all_text = ' '.join(voice_notes)
        
        # より包括的なキーワードカテゴリ
        emotion_categories = {
            "嬉しい": ["嬉しい", "楽しい", "うれしい", "喜び", "笑顔", "笑う", "幸せ", "ハッピー", "楽しかった", "面白い", "好き", "いい", "よかった"],
            "悲しい": ["悲しい", "泣く", "涙", "つらい", "苦しい", "寂しい", "嫌い", "いや", "だめ", "つまらない"],
            "怒り": ["怒る", "イライラ", "腹立つ", "ムカつく", "嫌い", "いや", "だめ", "うざい", "きらい"],
            "不安": ["不安", "心配", "怖い", "恐い", "ドキドキ", "緊張", "こわい", "びくびく", "どきどき"],
            "驚き": ["驚く", "びっくり", "驚いた", "意外", "予想外", "すごい", "すごく", "とても", "めっちゃ"],
            "学校": ["学校", "先生", "友達", "クラス", "授業", "勉強", "宿題", "テスト", "給食", "休み時間", "体育", "音楽", "図工"],
            "家族": ["お母さん", "お父さん", "家族", "兄弟", "姉妹", "おじいちゃん", "おばあちゃん", "ママ", "パパ", "お兄ちゃん", "お姉ちゃん"],
            "遊び": ["遊ぶ", "ゲーム", "おもちゃ", "公園", "友達", "楽しい", "面白い", "テレビ", "本", "絵本", "お絵描き", "ブロック"],
            "食べ物": ["食べる", "ご飯", "おやつ", "美味しい", "おいしい", "甘い", "辛い", "ケーキ", "アイス", "チョコ", "果物"],
            "体調": ["疲れた", "眠い", "元気", "調子", "頭", "お腹", "痛い", "だるい", "風邪", "熱"]
        }
        
        # 各カテゴリの出現回数をカウント
        category_counts = {}
        for category, keywords in emotion_categories.items():
            count = sum(all_text.count(keyword) for keyword in keywords)
            if count > 0:
                category_counts[category] = count
        
        # 上位トピックを取得（最低1回でも出現したものを表示）
        all_topics = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        
        # トピックが見つからない場合は、よく使われる単語から推測
        if not all_topics:
            # キーワード頻度から上位単語を取得
            processed_text = self._preprocess_text(all_text)
            words = processed_text.split()
            filtered_words = [word for word in words if word not in self.stop_words and len(word) > 1]
            word_freq = Counter(filtered_words)
            top_words = word_freq.most_common(3)
            
            # 単語から推測されるトピック
            inferred_topics = []
            for word, count in top_words:
                if any(emotion in word for emotion in ["嬉", "楽", "うれ", "喜", "笑", "幸"]):
                    inferred_topics.append({"topic": "嬉しい", "count": count, "percentage": 100.0})
                elif any(emotion in word for emotion in ["悲", "泣", "つら", "苦", "寂", "嫌"]):
                    inferred_topics.append({"topic": "悲しい", "count": count, "percentage": 100.0})
                elif any(emotion in word for emotion in ["怒", "いら", "腹", "ムカ", "うざ"]):
                    inferred_topics.append({"topic": "怒り", "count": count, "percentage": 100.0})
                elif any(emotion in word for emotion in ["不安", "心配", "怖", "恐", "ドキ", "緊張"]):
                    inferred_topics.append({"topic": "不安", "count": count, "percentage": 100.0})
                else:
                    inferred_topics.append({"topic": f"その他（{word}）", "count": count, "percentage": 100.0})
            
            return {
                "top_topics": inferred_topics[:3],
                "total_categories": len(inferred_topics)
            }
        
        # 上位3つ + その他でまとめる
        top_3_topics = all_topics[:3]
        other_topics = all_topics[3:]
        
        # その他の合計を計算
        other_count = sum(count for _, count in other_topics)
        total_count = sum(category_counts.values())
        
        result_topics = []
        
        # 上位3つを追加
        for topic, count in top_3_topics:
            result_topics.append({
                "topic": topic,
                "count": count,
                "percentage": round(count / total_count * 100, 1)
            })
        
        # その他がある場合は追加
        if other_count > 0:
            result_topics.append({
                "topic": "その他",
                "count": other_count,
                "percentage": round(other_count / total_count * 100, 1)
            })
        
        return {
            "top_topics": result_topics,
            "total_categories": len(category_counts)
        }

    def _analyze_language_features(self, voice_notes: List[str]) -> Dict[str, Any]:
        """言語的特徴分析"""
        if not voice_notes:
            return self._create_empty_language_features()
        
        # 全テキストを結合
        all_text = ' '.join(voice_notes)
        
        # 基本統計
        total_characters = len(all_text)
        total_sentences = len([s for s in all_text.split('。') if s.strip()])
        total_words = len(all_text.split())
        
        # 平均値
        avg_sentence_length = total_characters / total_sentences if total_sentences > 0 else 0
        avg_words_per_sentence = total_words / total_sentences if total_sentences > 0 else 0
        
        # 語彙の豊富さ（簡易版）
        unique_words = len(set(all_text.split()))
        vocabulary_richness = unique_words / total_words if total_words > 0 else 0
        
        # 感情表現の豊富さ
        emotion_words = ['嬉しい', '楽しい', '悲しい', '怒る', '不安', '驚く', '怖い', '幸せ']
        emotion_count = sum(all_text.count(word) for word in emotion_words)
        emotion_density = emotion_count / total_words if total_words > 0 else 0
        
        return {
            "total_characters": total_characters,
            "total_sentences": total_sentences,
            "total_words": total_words,
            "unique_words": unique_words,
            "avg_sentence_length": round(avg_sentence_length, 1),
            "avg_words_per_sentence": round(avg_words_per_sentence, 1),
            "vocabulary_richness": round(vocabulary_richness, 3),
            "emotion_density": round(emotion_density, 3),
            "avg_voice_note_length": round(total_characters / len(voice_notes), 1)
        }

    def _preprocess_text(self, text: str) -> str:
        """テキストの前処理"""
        # 改行文字を空白に置換
        text = text.replace('\n', ' ').replace('\r', ' ')
        
        # 句読点を除去
        text = re.sub(r'[。、！？]', ' ', text)
        
        # 連続する空白を単一の空白に置換
        text = re.sub(r'\s+', ' ', text)
        
        # 前後の空白を除去
        text = text.strip()
        
        return text

    def _create_empty_analysis(self) -> Dict[str, Any]:
        """空の分析結果を作成"""
        return {
            "keyword_frequency": {
                "top_keywords": [],
                "total_words": 0,
                "unique_words": 0
            },
            "topics": {
                "top_topics": [],
                "total_categories": 0
            },
            "language_features": self._create_empty_language_features(),
            "total_voice_notes": 0,
            "analysis_period": "データなし"
        }

    def _create_empty_language_features(self) -> Dict[str, Any]:
        """空の言語的特徴を作成"""
        return {
            "total_characters": 0,
            "total_sentences": 0,
            "total_words": 0,
            "unique_words": 0,
            "avg_sentence_length": 0,
            "avg_words_per_sentence": 0,
            "vocabulary_richness": 0,
            "emotion_density": 0,
            "avg_voice_note_length": 0
        }
