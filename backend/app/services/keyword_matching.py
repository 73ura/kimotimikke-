"""
キーワードマッチングサービス
音声テキストから特定のキーワードを検出し、親にフィードバックを提供
"""

import re
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from app.models import EmotionLog, EmotionCard, Intensity
from app.schemas import KeywordMatch, KeywordMatchingResult


class KeywordMatchingService:
    """キーワードマッチング分析サービス"""
    
    def __init__(self, db: Session):
        self.db = db
        
        # キーワードカテゴリの定義
        self.keyword_categories = {
            "positive": {
                "keywords": [
                    "うれしい", "楽しい", "面白い", "好き", "大好き", "すごい", "すばらしい",
                    "やった", "できた", "頑張った", "嬉しい", "笑った", "笑顔", "楽しかった",
                    "おもしろい", "きれい", "かわいい", "かっこいい", "すてき", "素晴らしい",
                    "最高", "完璧", "満足", "気持ちいい", "心地いい", "安心", "平和"
                ],
                "description": "ポジティブな感情や体験"
            },
            "negative": {
                "keywords": [
                    "悲しい", "つらい", "苦しい", "嫌い", "いや", "だめ", "できない",
                    "失敗", "間違い", "恥ずかしい", "はずかしい", "怖い", "こわい",
                    "不安", "心配", "困った", "こまった", "疲れた", "つかれた",
                    "眠い", "だるい", "しんどい", "苦手", "嫌だ", "いやだ", "嫌い"
                ],
                "description": "ネガティブな感情や体験"
            },
            "concern": {
                "keywords": [
                    "心配", "不安", "怖い", "こわい", "困った", "こまった", "どうしよう",
                    "大丈夫", "だいじょうぶ", "問題", "もんだい", "難しい", "むずかしい",
                    "わからない", "分からない", "理解できない", "理解", "りかい",
                    "助けて", "たすけて", "教えて", "おしえて", "どうすれば", "どうしたら"
                ],
                "description": "心配や不安を表す言葉"
            },
            "achievement": {
                "keywords": [
                    "できた", "やった", "頑張った", "がんばった", "成功", "せいこう",
                    "勝った", "かった", "優勝", "ゆうしょう", "一位", "いちい",
                    "合格", "ごうかく", "受かった", "うかった", "合格した", "ごうかくした",
                    "完成", "かんせい", "終わった", "おわった", "完了", "かんりょう",
                    "覚えた", "おぼえた", "覚えられた", "おぼえられた", "理解した", "りかいした"
                ],
                "description": "達成や成功を表す言葉"
            },
            "social": {
                "keywords": [
                    "友達", "ともだち", "友だち", "仲良し", "なかよし", "一緒", "いっしょ",
                    "遊んだ", "あそんだ", "遊び", "あそび", "会った", "あった", "会い", "あい",
                    "話した", "はなした", "話し", "はなし", "相談", "そうだん", "相談した",
                    "助けた", "たすけた", "助け", "たすけ", "手伝った", "てつだった", "手伝い",
                    "協力", "きょうりょく", "協力した", "きょうりょくした", "チーム", "チームワーク"
                ],
                "description": "社会的な関係や活動"
            },
            "learning": {
                "keywords": [
                    "勉強", "べんきょう", "学習", "がくしゅう", "学んだ", "まなんだ", "学び",
                    "覚えた", "おぼえた", "覚え", "おぼえ", "理解", "りかい", "理解した",
                    "分かった", "わかった", "分かり", "わかり", "知った", "しった", "知り",
                    "習った", "ならった", "習い", "ならい", "練習", "れんしゅう", "練習した",
                    "読んだ", "よんだ", "読書", "どくしょ", "書いた", "かいた", "書き", "かき"
                ],
                "description": "学習や教育に関連する言葉"
            },
            "physical": {
                "keywords": [
                    "走った", "はしった", "走り", "はしり", "歩いた", "あるいた", "歩き", "あるき",
                    "跳んだ", "とんだ", "跳び", "とび", "泳いだ", "およいだ", "泳ぎ", "およぎ",
                    "投げた", "なげた", "投げ", "なげ", "蹴った", "けった", "蹴り", "けり",
                    "運動", "うんどう", "スポーツ", "体育", "たいいく", "体操", "たいそう",
                    "疲れた", "つかれた", "疲れ", "つかれ", "元気", "げんき", "健康", "けんこう"
                ],
                "description": "身体的な活動や健康"
            },
            "family": {
                "keywords": [
                    "お母さん", "おかあさん", "お父さん", "おとうさん", "ママ", "パパ",
                    "おじいちゃん", "おばあちゃん", "おじいさん", "おばあさん", "お兄ちゃん",
                    "おにいちゃん", "お姉ちゃん", "おねえちゃん", "兄弟", "きょうだい", "姉妹",
                    "家族", "かぞく", "家", "いえ", "お家", "おうち", "帰った", "かえった",
                    "帰り", "かえり", "一緒に", "いっしょに", "一緒", "いっしょ"
                ],
                "description": "家族に関連する言葉"
            }
        }
    
    async def analyze_keyword_matches(
        self, 
        child_id: str, 
        user_id: str, 
        days: int = 30
    ) -> KeywordMatchingResult:
        """キーワードマッチング分析を実行"""
        
        # 期間を計算
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # 音声テキストを含む感情記録を取得
        emotion_logs = self.db.query(EmotionLog).join(EmotionCard).join(Intensity).filter(
            and_(
                EmotionLog.child_id == child_id,
                EmotionLog.user_id == user_id,
                EmotionLog.created_at >= start_date,
                EmotionLog.created_at <= end_date,
                EmotionLog.voice_note.isnot(None),
                EmotionLog.voice_note != ""
            )
        ).order_by(desc(EmotionLog.created_at)).all()
        
        if not emotion_logs:
            return self._create_empty_analysis(days)
        
        # キーワードマッチングを実行
        keyword_matches = self._find_keyword_matches(emotion_logs)
        
        # インサイトと推奨事項を生成
        insights = self._generate_insights(keyword_matches, len(emotion_logs))
        recommendations = self._generate_recommendations(keyword_matches, len(emotion_logs))
        
        return KeywordMatchingResult(
            total_voice_notes=len(emotion_logs),
            analysis_period=f"過去{days}日間",
            keyword_matches=keyword_matches,
            insights=insights,
            recommendations=recommendations
        )
    
    def _find_keyword_matches(self, emotion_logs: List[EmotionLog]) -> List[KeywordMatch]:
        """キーワードマッチングを実行"""
        keyword_counts = defaultdict(int)
        keyword_examples = defaultdict(list)
        total_matches = 0
        
        for log in emotion_logs:
            if not log.voice_note:
                continue
                
            text = log.voice_note.lower()
            
            # 各カテゴリのキーワードをチェック
            for category, data in self.keyword_categories.items():
                for keyword in data["keywords"]:
                    # キーワードの出現回数をカウント
                    matches = re.findall(keyword.lower(), text)
                    if matches:
                        keyword_counts[f"{category}:{keyword}"] += len(matches)
                        total_matches += len(matches)
                        
                        # 例文を保存（最大3つまで）
                        if len(keyword_examples[f"{category}:{keyword}"]) < 3:
                            # キーワードの前後10文字を抽出
                            start = max(0, text.find(keyword.lower()) - 10)
                            end = min(len(text), text.find(keyword.lower()) + len(keyword) + 10)
                            example = text[start:end].strip()
                            if example not in keyword_examples[f"{category}:{keyword}"]:
                                keyword_examples[f"{category}:{keyword}"].append(example)
        
        # KeywordMatchオブジェクトを作成
        keyword_matches = []
        for key, count in keyword_counts.items():
            category, keyword = key.split(":", 1)
            percentage = round(count / total_matches * 100, 1) if total_matches > 0 else 0
            
            keyword_matches.append(KeywordMatch(
                keyword=keyword,
                category=category,
                count=count,
                percentage=percentage,
                examples=keyword_examples[key]
            ))
        
        # 出現回数でソート
        keyword_matches.sort(key=lambda x: x.count, reverse=True)
        
        return keyword_matches
    
    def _generate_insights(self, keyword_matches: List[KeywordMatch], total_notes: int) -> List[str]:
        """インサイトを生成"""
        insights = []
        
        if not keyword_matches:
            return ["音声記録からキーワードを検出できませんでした。"]
        
        # カテゴリ別の統計
        category_stats = defaultdict(lambda: {"count": 0, "keywords": []})
        for match in keyword_matches:
            category_stats[match.category]["count"] += match.count
            category_stats[match.category]["keywords"].append(match.keyword)
        
        # 最も多いカテゴリを特定
        if category_stats:
            top_category = max(category_stats.items(), key=lambda x: x[1]["count"])
            category_name = self.keyword_categories[top_category[0]]["description"]
            insights.append(f"最も多く使われているのは「{category_name}」に関連する言葉です。")
        
        # ポジティブとネガティブの比率
        positive_count = category_stats.get("positive", {}).get("count", 0)
        negative_count = category_stats.get("negative", {}).get("count", 0)
        
        if positive_count > 0 and negative_count > 0:
            ratio = positive_count / (positive_count + negative_count)
            if ratio > 0.7:
                insights.append("ポジティブな言葉が多く使われており、前向きな気持ちが感じられます。")
            elif ratio < 0.3:
                insights.append("ネガティブな言葉が多く使われており、心配な気持ちが感じられます。")
            else:
                insights.append("ポジティブとネガティブな言葉がバランスよく使われています。")
        
        # 学習関連のキーワード
        learning_count = category_stats.get("learning", {}).get("count", 0)
        if learning_count > 0:
            insights.append("学習や勉強に関する言葉が多く使われており、学習意欲が感じられます。")
        
        # 社会的なキーワード
        social_count = category_stats.get("social", {}).get("count", 0)
        if social_count > 0:
            insights.append("友達や人との関わりに関する言葉が多く使われており、社会的な関心が高いようです。")
        
        return insights
    
    def _generate_recommendations(self, keyword_matches: List[KeywordMatch], total_notes: int) -> List[str]:
        """推奨事項を生成"""
        recommendations = []
        
        if not keyword_matches:
            return ["音声記録を増やすことで、より詳細な分析が可能になります。"]
        
        # カテゴリ別の統計
        category_stats = defaultdict(lambda: {"count": 0, "keywords": []})
        for match in keyword_matches:
            category_stats[match.category]["count"] += match.count
            category_stats[match.category]["keywords"].append(match.keyword)
        
        # ネガティブな言葉が多い場合の推奨事項
        negative_count = category_stats.get("negative", {}).get("count", 0)
        concern_count = category_stats.get("concern", {}).get("count", 0)
        
        if negative_count > 0 or concern_count > 0:
            recommendations.append("ネガティブな感情や心配事について、お子さんと話し合う時間を作ることをお勧めします。")
            recommendations.append("お子さんの気持ちを聞き、安心感を与えるような対応を心がけてください。")
        
        # 学習関連の推奨事項
        learning_count = category_stats.get("learning", {}).get("count", 0)
        if learning_count > 0:
            recommendations.append("学習意欲が感じられるので、お子さんの興味に合わせた学習環境を整えることをお勧めします。")
        
        # 社会的な推奨事項
        social_count = category_stats.get("social", {}).get("count", 0)
        if social_count > 0:
            recommendations.append("友達との関係性が重要視されているようです。社交的な活動をサポートしてあげてください。")
        
        # 身体的活動の推奨事項
        physical_count = category_stats.get("physical", {}).get("count", 0)
        if physical_count > 0:
            recommendations.append("身体的な活動への関心が高いようです。運動やスポーツを一緒に楽しむことをお勧めします。")
        
        # 家族関係の推奨事項
        family_count = category_stats.get("family", {}).get("count", 0)
        if family_count > 0:
            recommendations.append("家族との時間が重要視されているようです。家族で過ごす時間を大切にしてください。")
        
        return recommendations
    
    def _create_empty_analysis(self, days: int) -> KeywordMatchingResult:
        """空の分析結果を作成"""
        return KeywordMatchingResult(
            total_voice_notes=0,
            analysis_period=f"過去{days}日間",
            keyword_matches=[],
            insights=["音声記録が不足しているため、キーワード分析を実行できませんでした。"],
            recommendations=["音声記録を増やすことで、より詳細な分析が可能になります。"]
        )
