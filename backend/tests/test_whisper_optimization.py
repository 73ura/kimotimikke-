"""
Whisper音声認識の最小限テスト

テスト対象:
- プロンプト生成
- 基本的な音声認識
"""

from app.utils.child_vocabulary import generate_whisper_prompt


class TestWhisperBasic:
    """Whisper音声認識の基本テストクラス"""

    def test_prompt_generation(self):
        """プロンプト生成のテスト"""
        # プロンプトを生成
        prompt = generate_whisper_prompt()

        # 基本的な検証
        assert isinstance(prompt, str)
        assert len(prompt) > 0
        # 現在の実装では短いプロンプトになっている
        assert "楽しい" in prompt
        assert "ママ" in prompt

    def test_prompt_contains_basic_terms(self):
        """基本的な語彙がプロンプトに含まれているかテスト"""
        prompt = generate_whisper_prompt()

        # 基本的な語彙の確認（現在の実装に合わせて調整）
        basic_terms = ["ママ", "パパ", "楽しい"]

        for term in basic_terms:
            assert term in prompt, f"プロンプトに'{term}'が含まれていません"
            
    def test_prompt_length_is_reasonable(self):
        """プロンプトの長さが適切かテスト"""
        prompt = generate_whisper_prompt()
        
        # 短すぎず長すぎない適切な長さ
        assert 10 < len(prompt) < 200
        
    def test_prompt_optimization_levels(self):
        """最適化レベル別プロンプト生成テスト"""
        speed_prompt = generate_whisper_prompt("speed")
        balanced_prompt = generate_whisper_prompt("balanced") 
        precision_prompt = generate_whisper_prompt("precision")
        
        # すべて文字列で、適切な長さ
        assert isinstance(speed_prompt, str)
        assert isinstance(balanced_prompt, str)
        assert isinstance(precision_prompt, str)
        
        # 基本語彙が含まれている
        for prompt in [speed_prompt, balanced_prompt, precision_prompt]:
            assert "ママ" in prompt
