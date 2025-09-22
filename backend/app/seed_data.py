import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import EmotionCard, Intensity, RoleplayScenario, RoleplayAdvice


async def seed_emotion_cards(db: AsyncSession):
    """感情カードのシードデータを作成"""
    emotion_cards = [
        {
            "id": uuid.uuid4(),
            "label": "ふゆかい",
            "image_url": "/images/emotions/fuyukai.webp",
            "color": "#FF0000",
        },
        {
            "id": uuid.uuid4(),
            "label": "いかり",
            "image_url": "/images/emotions/ikari.webp",
            "color": "#FF0000",
        },
        {
            "id": uuid.uuid4(),
            "label": "はずかしい",
            "image_url": "/images/emotions/hazukashii.webp",
            "color": "#FF0000",
        },
        {
            "id": uuid.uuid4(),
            "label": "きんちょう",
            "image_url": "/images/emotions/kinchou.webp",
            "color": "#FF0000",
        },
        {
            "id": uuid.uuid4(),
            "label": "こわい",
            "image_url": "/images/emotions/kowai.webp",
            "color": "#0000FF",
        },
        {
            "id": uuid.uuid4(),
            "label": "かなしい",
            "image_url": "/images/emotions/kanashii.webp",
            "color": "#0000FF",
        },
        {
            "id": uuid.uuid4(),
            "label": "こまった",
            "image_url": "/images/emotions/komatta.webp",
            "color": "#0000FF",
        },
        {
            "id": uuid.uuid4(),
            "label": "あんしん",
            "image_url": "/images/emotions/anshin.webp",
            "color": "#00CC66",
        },
        {
            "id": uuid.uuid4(),
            "label": "びっくり",
            "image_url": "/images/emotions/bikkuri.webp",
            "color": "#00CC66",
        },
        {
            "id": uuid.uuid4(),
            "label": "わからない",
            "image_url": "/images/emotions/wakaranai.webp",
            "color": "#999999",
        },
        {
            "id": uuid.uuid4(),
            "label": "うれしい",
            "image_url": "/images/emotions/ureshii.webp",
            "color": "#FFCC00",
        },
        {
            "id": uuid.uuid4(),
            "label": "ゆかい",
            "image_url": "/images/emotions/yukai.webp",
            "color": "#FFCC00",
        },
    ]

    for card_data in emotion_cards:
        card = EmotionCard(**card_data)
        db.add(card)

    await db.commit()
    print(f"✅ {len(emotion_cards)}個の感情カードをシードしました")


async def seed_intensities(db: AsyncSession):
    """強度のシードデータを作成"""
    intensities = [
        {"id": 1, "color_modifier": 40},
        {"id": 2, "color_modifier": 70},
        {"id": 3, "color_modifier": 100},
    ]

    for intensity_data in intensities:
        intensity = Intensity(**intensity_data)
        db.add(intensity)

    await db.commit()
    print(f"✅ {len(intensities)}個の強度をシードしました")


async def seed_roleplay_scenarios(db: AsyncSession):
    """ロールプレイシナリオのシードデータを作成"""
    scenarios_data = [
        {
            "title": "おもちゃを\nおともだちに\nとられた",
            "description": "おともだちに おもちゃを とられたら…どんな きもちかな？",
            "color": "#FF6B6B",
            "scenario_content": "おともだちがあなたのお気に入りのおもちゃを取ってしまいました。この時、どんな気持ちになりますか？",
            "image_url": "/images/roleplay.webp",
            "emotion_types": ["kanashii", "ikari", "komatta"],
            "keywords": ["おもちゃ", "とられた", "おともだち", "いやだ"],
            "age_range_min": 3,
            "age_range_max": 8,
            "difficulty_level": 1,
            "sort_order": 1,
        },
        {
            "title": "おともだちと\nけんかしちゃった",
            "description": "おともだちと けんかを してしまったら…どんな きもちかな？",
            "color": "#4ECDC4",
            "scenario_content": "おともだちと意見が合わずにけんかをしてしまいました。この時、どんな気持ちになりますか？",
            "image_url": "/images/roleplay.webp",
            "emotion_types": ["ikari", "kanashii", "komatta"],
            "keywords": ["けんか", "おともだち", "いかり", "かなしい"],
            "age_range_min": 3,
            "age_range_max": 8,
            "difficulty_level": 2,
            "sort_order": 2,
        },
        {
            "title": "はっぴょうかいで\nセリフを\nまちがえた",
            "description": "はっぴょうかいで セリフを まちがえたら…どんな きもちかな？",
            "color": "#51cf66",
            "scenario_content": "みんなの前で発表会をしている時に、セリフを間違えてしまいました。この時、どんな気持ちになりますか？",
            "image_url": "/images/roleplay.webp",
            "emotion_types": ["kanashii", "komatta", "fuyukai"],
            "keywords": ["はっぴょうかい", "セリフ", "まちがえた", "はずかしい"],
            "age_range_min": 4,
            "age_range_max": 8,
            "difficulty_level": 2,
            "sort_order": 3,
        },
        {
            "title": "おもちゃを\nかってもらえなかった",
            "description": "おもちゃを かってもらえなかったら…どんな きもちかな？",
            "color": "#ff8cc8",
            "scenario_content": "お店で欲しいおもちゃを見つけたけれど、お父さんやお母さんに買ってもらえませんでした。この時、どんな気持ちになりますか？",
            "image_url": "/images/roleplay.webp",
            "emotion_types": ["kanashii", "ikari", "komatta"],
            "keywords": ["おもちゃ", "かってもらえない", "ほしい", "かなしい"],
            "age_range_min": 3,
            "age_range_max": 7,
            "difficulty_level": 1,
            "sort_order": 4,
        },
        {
            "title": "えを「へただね」\nといわれた",
            "description": "えを「へただね」と いわれたら…どんな きもちかな？",
            "color": "#74c0fc",
            "scenario_content": "一生懸命描いた絵を誰かに「へただね」と言われてしまいました。この時、どんな気持ちになりますか？",
            "image_url": "/images/roleplay.webp",
            "emotion_types": ["kanashii", "ikari", "fuyukai"],
            "keywords": ["え", "へた", "いわれた", "かなしい", "いかり"],
            "age_range_min": 3,
            "age_range_max": 8,
            "difficulty_level": 2,
            "sort_order": 5,
        },
    ]
    
    # シナリオを作成
    created_scenarios = []
    for scenario_data in scenarios_data:
        scenario = RoleplayScenario(**scenario_data)
        db.add(scenario)
        created_scenarios.append(scenario)
    
    await db.commit()
    
    # 各シナリオのIDを取得
    for scenario in created_scenarios:
        await db.refresh(scenario)
    
    print(f"✅ {len(created_scenarios)} 件のシナリオをシードしました")
    
    # アドバイスデータを作成
    await seed_roleplay_advice(db, created_scenarios)


async def seed_roleplay_advice(db: AsyncSession, scenarios: list[RoleplayScenario]):
    """ロールプレイアドバイスのシードデータを作成"""
    
    # アドバイスデータ
    advice_data = {
        "kanashii": "「かなしいよ」って いってみよう",
        "komatta": "「どうしたらいい？」って\nきいてみよう", 
        "fuyukai": "「いやだな」って いってみよう",
        "ikari": "いきを「すーっ」「はーっ」と\nゆっくりしてみよう",
    }
    
    created_advice = []
    
    for scenario in scenarios:
        # 各シナリオの対象感情に対してアドバイスを作成
        for emotion_id in scenario.emotion_types:
            if emotion_id in advice_data:
                advice = RoleplayAdvice(
                    scenario_id=scenario.id,
                    emotion_id=emotion_id,
                    advice_text=advice_data[emotion_id],
                    advice_type="general"
                )
                db.add(advice)
                created_advice.append(advice)
    
    await db.commit()
    print(f"✅ {len(created_advice)} 件のアドバイスをシードしました")


async def run_seeds(db: AsyncSession):
    """全てのシードを実行"""
    print("シードデータを作成中...")

    # 感情カードのチェック
    result = await db.execute(select(EmotionCard))
    existing_cards = result.scalars().all()
    if not existing_cards:
        await seed_emotion_cards(db)
    else:
        print(f"⚠️ 感情カードは既に{len(existing_cards)}個存在します")

    # 強度のチェック
    result = await db.execute(select(Intensity))
    existing_intensities = result.scalars().all()
    if not existing_intensities:
        await seed_intensities(db)
    else:
        print(f"⚠️ 強度は既に{len(existing_intensities)}個存在します")

    # ロールプレイシナリオのチェック
    result = await db.execute(select(RoleplayScenario))
    existing_scenarios = result.scalars().all()
    if not existing_scenarios:
        await seed_roleplay_scenarios(db)
    else:
        print(f"⚠️ ロールプレイシナリオは既に{len(existing_scenarios)}件存在します")

    print("✅ シード完了！")
