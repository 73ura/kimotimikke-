"""
Gemini AIサービス
音声テキストを自然言語で分析し、深い洞察を提供
"""

import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, desc, select
from sqlalchemy.orm import selectinload

from app.models import EmotionLog, EmotionCard, Intensity
from app.schemas import GeminiAnalysisResult

logger = logging.getLogger(__name__)


class GeminiAIService:
    """Gemini AI分析サービス"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        
        # Gemini AIの初期化
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEYが設定されていません。Gemini AI機能は無効になります。")
            self.enabled = False
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.enabled = True
    
    async def analyze_voice_texts(
        self, 
        child_id: str, 
        user_id: str, 
        days: int = 30
    ) -> GeminiAnalysisResult:
        """音声テキストをGemini AIで分析"""
        
        if not self.enabled:
            return self._create_disabled_analysis(days)
        
        # 期間を計算
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # 音声テキストを含む感情記録を取得
        stmt = select(EmotionLog).options(
            selectinload(EmotionLog.emotion_card),
            selectinload(EmotionLog.intensity)
        ).filter(
            and_(
                EmotionLog.child_id == child_id,
                EmotionLog.user_id == user_id,
                EmotionLog.created_at >= start_date,
                EmotionLog.created_at <= end_date,
                EmotionLog.voice_note.isnot(None),
                EmotionLog.voice_note != ""
            )
        ).order_by(desc(EmotionLog.created_at))
        
        result = await self.db.execute(stmt)
        emotion_logs = result.scalars().all()
        
        if not emotion_logs:
            return self._create_empty_analysis(days)
        
        # 音声テキストを整理
        voice_texts = self._prepare_voice_texts(emotion_logs)
        
        try:
            # Gemini AIで分析実行
            analysis_result = self._analyze_with_gemini(voice_texts, days)
            return analysis_result
        except Exception as e:
            logger.error(f"Gemini AI分析でエラーが発生しました: {str(e)}")
            return self._create_error_analysis(days, str(e))
    
    def _prepare_voice_texts(self, emotion_logs: List[EmotionLog]) -> List[Dict[str, Any]]:
        """音声テキストを分析用に整理"""
        voice_texts = []
        
        for log in emotion_logs:
            voice_texts.append({
                "date": log.created_at.strftime("%Y-%m-%d %H:%M"),
                "emotion": log.emotion_card.label,
                "intensity": log.intensity.id,
                "text": log.voice_note
            })
        
        return voice_texts
    
    def _analyze_with_gemini(self, voice_texts: List[Dict[str, Any]], days: int) -> GeminiAnalysisResult:
        """Gemini AIで分析実行"""
        
        # プロンプトを作成
        prompt = self._create_analysis_prompt(voice_texts, days)
        
        try:
            # Gemini AIに送信（同期的に実行）
            response = self.model.generate_content(prompt)
            
            # レスポンスを解析
            analysis_data = self._parse_gemini_response(response.text)
            
            return GeminiAnalysisResult(
                total_voice_notes=len(voice_texts),
                analysis_period=f"過去{days}日間",
                emotional_insights=analysis_data.get("emotional_insights", ""),
                behavioral_patterns=analysis_data.get("behavioral_patterns", ""),
                developmental_observations=analysis_data.get("developmental_observations", ""),
                parent_guidance=analysis_data.get("parent_guidance", ""),
                concerns_and_strengths=analysis_data.get("concerns_and_strengths", ""),
                next_steps=analysis_data.get("next_steps", "")
            )
        except Exception as e:
            logger.error(f"Gemini AI API呼び出しでエラー: {str(e)}")
            raise e
    
    def _create_analysis_prompt(self, voice_texts: List[Dict[str, Any]], days: int) -> str:
        """分析用プロンプトを作成"""
        
        # 音声テキストを文字列に変換
        texts_summary = []
        for i, text_data in enumerate(voice_texts[:10]):  # 最新10件まで
            texts_summary.append(f"{i+1}. {text_data['date']} - 感情: {text_data['emotion']} (強度: {text_data['intensity']})\n   内容: {text_data['text']}")
        
        prompt = f"""
あなたは子どもの感情記録を分析する専門家です。以下の音声テキストデータを分析して、親に有用な洞察を提供してください。

【分析対象データ】
期間: 過去{days}日間
記録数: {len(voice_texts)}件

【音声記録】
{chr(10).join(texts_summary)}

【分析項目】
以下の6つの観点から分析し、それぞれ200-300文字程度で回答してください：

1. 感情に関する洞察 (emotional_insights)
- 子どもの感情の特徴や傾向
- 感情の変化パターン
- 感情表現の特徴

2. 行動パターンの分析 (behavioral_patterns)
- 日常的な行動の特徴
- 特定の状況での反応パターン
- 行動の一貫性や変化

3. 親へのガイダンス (parent_guidance)
- 具体的な対応方法
- コミュニケーションのコツ
- サポートのポイント

4. 心配事と強み (concerns_and_strengths)
- 注意すべき点
- 子どもの強みや良い点
- バランスの取れた視点

5. 次のステップの提案 (next_steps)
- 今後の観察ポイント
- 具体的なアクションプラン
- 長期的な視点での提案

【回答形式】
以下のJSON形式で回答してください：
{{
  "emotional_insights": "感情に関する洞察をここに記述",
  "behavioral_patterns": "行動パターンの分析をここに記述",,
  "parent_guidance": "親へのガイダンスをここに記述",
  "concerns_and_strengths": "心配事と強みをここに記述",
  "next_steps": "次のステップの提案をここに記述"
}}

【注意事項】
- 温かく、建設的なトーンで回答してください
- 専門用語は避け、親が理解しやすい表現を使用してください
- 記録からの根拠を示しつつ、具体的で実践的なアドバイスを心がけてください
- 子どもの個性を尊重し、比較は避けてください
"""
        
        return prompt
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, str]:
        """Gemini AIのレスポンスを解析"""
        try:
            import json
            
            # JSON部分を抽出
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("JSON形式が見つかりません")
            
            json_str = response_text[start_idx:end_idx]
            return json.loads(json_str)
            
        except Exception as e:
            logger.error(f"Gemini AIレスポンス解析エラー: {str(e)}")
            # フォールバック: レスポンスをそのまま使用
            return {
                "emotional_insights": response_text[:500] + "..." if len(response_text) > 500 else response_text,
                "behavioral_patterns": "分析中にエラーが発生しました。",
                "developmental_observations": "分析中にエラーが発生しました。",
                "parent_guidance": "分析中にエラーが発生しました。",
                "concerns_and_strengths": "分析中にエラーが発生しました。",
                "next_steps": "分析中にエラーが発生しました。"
            }
    
    def _create_empty_analysis(self, days: int) -> GeminiAnalysisResult:
        """空の分析結果を作成"""
        return GeminiAnalysisResult(
            total_voice_notes=0,
            analysis_period=f"過去{days}日間",
            emotional_insights="音声記録が不足しているため、分析を実行できませんでした。",
            behavioral_patterns="音声記録を増やすことで、より詳細な分析が可能になります。",
            developmental_observations="継続的な記録により、お子さんの発達状況を把握できます。",
            parent_guidance="定期的な感情記録を通じて、お子さんの気持ちを理解するサポートを続けてください。",
            concerns_and_strengths="記録を続けることで、お子さんの特徴や成長をより深く理解できます。",
            next_steps="音声記録を継続し、定期的に分析結果を確認することをお勧めします。"
        )
    
    def _create_disabled_analysis(self, days: int) -> GeminiAnalysisResult:
        """Gemini AI無効時の分析結果を作成"""
        return GeminiAnalysisResult(
            total_voice_notes=0,
            analysis_period=f"過去{days}日間",
            emotional_insights="Gemini AI機能が無効になっています。管理者にお問い合わせください。",
            behavioral_patterns="Gemini AI機能が無効になっています。",
            developmental_observations="Gemini AI機能が無効になっています。",
            parent_guidance="Gemini AI機能が無効になっています。",
            concerns_and_strengths="Gemini AI機能が無効になっています。",
            next_steps="Gemini AI機能が無効になっています。"
        )
    
    def _create_error_analysis(self, days: int, error_message: str) -> GeminiAnalysisResult:
        """エラー時の分析結果を作成"""
        return GeminiAnalysisResult(
            total_voice_notes=0,
            analysis_period=f"過去{days}日間",
            emotional_insights=f"分析中にエラーが発生しました: {error_message}",
            behavioral_patterns="分析を再試行するか、管理者にお問い合わせください。",
            developmental_observations="分析を再試行するか、管理者にお問い合わせください。",
            parent_guidance="分析を再試行するか、管理者にお問い合わせください。",
            concerns_and_strengths="分析を再試行するか、管理者にお問い合わせください。",
            next_steps="分析を再試行するか、管理者にお問い合わせください。"
        )
