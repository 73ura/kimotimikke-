'use client';

import type React from 'react';

import { KokoronDefault, SpeechBubble } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { createChild, getChildrenCount } from '@/lib/api';
import {
  borderRadius,
  colors,
  commonStyles,
  fontSize,
  spacing,
} from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SetupPage() {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [childBirthYear, setChildBirthYear] = useState('');
  const [childBirthMonth, setChildBirthMonth] = useState('');
  const [childBirthDay, setChildBirthDay] = useState('');
  const [childGender, setChildGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [childrenCount, setChildrenCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 既存の子供の数をチェック
  useEffect(() => {
    const checkExistingChildren = async () => {
      if (firebaseUser) {
        try {
          const count = await getChildrenCount(firebaseUser);
          setChildrenCount(count);

          // 既に子供がいる場合は、アプリホームにリダイレクト
          if (count > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.log('既に子供が登録済み - /appにリダイレクト');
            }
            router.push('/app');
            return;
          }
        } catch (error) {
          console.error('子供の数取得エラー:', error);
          // Firebase quota exceeded の場合は、とりあえずセットアップを続行
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'auth/quota-exceeded'
          ) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(
                'Firebase quota exceeded - セットアップを続行します',
              );
            }
            setChildrenCount(0); // セットアップが必要と仮定
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    checkExistingChildren();
  }, [firebaseUser, router]);

  // ローディング中
  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <p>読み込み中...</p>
      </div>
    );
  }

  // 既に子供がいる場合は何も表示しない（リダイレクト中）
  if (childrenCount > 0) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !childName.trim() ||
      !childBirthYear ||
      !childBirthMonth ||
      !childBirthDay ||
      !childGender
    )
      return;

    setIsSubmitting(true);
    try {
      // 誕生日をDate型に変換
      const birthDate = new Date(
        parseInt(childBirthYear),
        parseInt(childBirthMonth) - 1,
        parseInt(childBirthDay),
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('プロフィール保存:', {
          childName,
          birthDate: birthDate.toISOString().split('T')[0], // YYYY-MM-DD形式
          childGender,
        });
      }

      if (firebaseUser) {
        const childData = {
          nickname: childName,
          birth_date: birthDate.toISOString().split('T')[0], // YYYY-MM-DD形式
          gender: childGender,
        };

        const createdChild = await createChild(childData, firebaseUser);
        if (process.env.NODE_ENV === 'development') {
          console.log('子どもプロフィール作成完了:', createdChild);
        }

        // ダミーでユーザー情報を更新（既存のコードとの互換性のため）
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...user,
            displayName: childName,
            birthDate: birthDate.toISOString().split('T')[0], // YYYY-MM-DD形式
            childGender: childGender,
          }),
        );

        // セットアップ完了後、アプリホームに遷移
        router.push('/app');
      } else {
        throw new Error('Firebase user not found');
      }
    } catch (error) {
      console.error('セットアップエラー:', error);
      alert('セットアップに失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        ...commonStyles.page.container,
        backgroundImage: 'url(/images/background.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div style={commonStyles.page.mainContent}>
        <SpeechBubble text={['はじめまして！', 'なんてよんだらいいかな？']} />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
        </div>

        {/* セットアップフォーム */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            maxWidth: '400px',
            width: '100%',
            margin: `${spacing.lg} 0`,
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
            初期設定
          </h1>

          <div
            style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: '#f8f9fa',
              borderRadius: borderRadius.small,
              fontSize: fontSize.small,
              color: colors.text.secondary,
              lineHeight: 1.4,
            }}
          >
            <p style={{ margin: 0 }}>
              💡 アプリを使用いただくお子様の情報をご入力ください
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: spacing.lg }}>
              <label
                style={{
                  display: 'block',
                  color: colors.text.primary,
                  fontSize: fontSize.xl,
                  fontWeight: 'bold',
                  marginBottom: spacing.sm,
                }}
              >
                こころんに呼んでほしいおなまえ
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="例: たろう"
                required
                style={{
                  width: '100%',
                  padding: spacing.md,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: borderRadius.medium,
                  fontSize: fontSize.xl,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: spacing.xl }}>
              <label
                style={{
                  display: 'block',
                  color: colors.text.primary,
                  fontSize: fontSize.xl,
                  fontWeight: 'bold',
                  marginBottom: spacing.sm,
                }}
              >
                おたんじょうび
              </label>

              <div style={{ display: 'flex', gap: spacing.sm }}>
                {/* 年選択 */}
                <select
                  value={childBirthYear}
                  onChange={(e) => setChildBirthYear(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    border: `2px solid ${colors.primary}`,
                    borderRadius: borderRadius.medium,
                    fontSize: fontSize.xl,
                    outline: 'none',
                    backgroundColor: colors.background.white,
                    boxSizing: 'border-box',
                    appearance: 'none',
                    backgroundImage:
                      'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%204.9A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%204.9%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '12px auto',
                    paddingRight: '32px',
                  }}
                >
                  <option
                    value=""
                    style={{ fontSize: '24px', padding: '16px' }}
                  >
                    年
                  </option>
                  {Array.from(
                    { length: 18 },
                    (_, i) => new Date().getFullYear() - i,
                  ).map((year) => (
                    <option
                      key={year}
                      value={year}
                      style={{ fontSize: '24px', padding: '16px' }}
                    >
                      {year}年
                    </option>
                  ))}
                </select>

                {/* 月選択 */}
                <select
                  value={childBirthMonth}
                  onChange={(e) => setChildBirthMonth(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    border: `2px solid ${colors.primary}`,
                    borderRadius: borderRadius.medium,
                    fontSize: fontSize.xl,
                    outline: 'none',
                    backgroundColor: colors.background.white,
                    boxSizing: 'border-box',
                    appearance: 'none',
                    backgroundImage:
                      'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%204.9A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%204.9%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '12px auto',
                    paddingRight: '32px',
                  }}
                >
                  <option
                    value=""
                    style={{ fontSize: '24px', padding: '16px' }}
                  >
                    月
                  </option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option
                      key={month}
                      value={month.toString().padStart(2, '0')}
                      style={{ fontSize: '24px', padding: '16px' }}
                    >
                      {month}月
                    </option>
                  ))}
                </select>

                {/* 日選択 */}
                <select
                  value={childBirthDay}
                  onChange={(e) => setChildBirthDay(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    border: `2px solid ${colors.primary}`,
                    borderRadius: borderRadius.medium,
                    fontSize: fontSize.xl,
                    outline: 'none',
                    backgroundColor: colors.background.white,
                    boxSizing: 'border-box',
                    appearance: 'none',
                    backgroundImage:
                      'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%204.9A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%204.9%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '12px auto',
                    paddingRight: '32px',
                  }}
                >
                  <option
                    value=""
                    style={{ fontSize: '24px', padding: '16px' }}
                  >
                    日
                  </option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option
                      key={day}
                      value={day.toString().padStart(2, '0')}
                      style={{ fontSize: '24px', padding: '16px' }}
                    >
                      {day}日
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: spacing.xl }}>
              <label
                style={{
                  display: 'block',
                  color: colors.text.primary,
                  fontSize: fontSize.xl,

                  fontWeight: 'bold',
                  marginBottom: spacing.sm,
                }}
              >
                せいべつ
              </label>
              <select
                value={childGender}
                onChange={(e) => setChildGender(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: spacing.md,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: borderRadius.medium,
                  fontSize: fontSize.xl,
                  outline: 'none',
                  backgroundColor: colors.background.white,
                  boxSizing: 'border-box',
                  appearance: 'none',
                  backgroundImage:
                    'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%204.9A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%204.9%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '12px auto',
                  paddingRight: '32px',
                }}
              >
                <option value="" style={{ fontSize: '24px', padding: '16px' }}>
                  せいべつ（こたえなくてもOKだよ）
                </option>
                {['おとこのこ', 'おんなのこ', 'こたえない'].map((gender) => (
                  <option
                    key={gender}
                    value={gender}
                    style={{ fontSize: '24px', padding: '16px' }}
                  >
                    {gender}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                disabled={!childName.trim() || isSubmitting}
                style={{
                  background: colors.primary,
                  color: colors.text.white,
                  border: 'none',
                  borderRadius: borderRadius.button,
                  padding: `${spacing.md} ${spacing.xl}`,
                  fontSize: fontSize.xl,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minWidth: '200px',
                }}
              >
                {isSubmitting ? '設定中...' : 'はじめる'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
