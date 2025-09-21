'use client';

import type React from 'react';

import {
  HamburgerMenu,
  KokoronDefault,
  SpeechBubble,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/hooks/useChildren';
import { createChild, deleteChildProfile, updateChildProfile } from '@/lib/api';
import {
  borderRadius,
  colors,
  commonStyles,
  fontSize,
  spacing,
} from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SettingPage() {
  const { firebaseUser, isLoading: authLoading } = useAuth();
  const { children, loading: childrenLoading, refetch } = useChildren();
  const router = useRouter();

  const [childName, setChildName] = useState('');
  const [childBirthYear, setChildBirthYear] = useState('');
  const [childBirthMonth, setChildBirthMonth] = useState('');
  const [childBirthDay, setChildBirthDay] = useState('');
  const [childGender, setChildGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // 子供が1人しかいない場合は自動的に編集モード
  useEffect(() => {
    if (children.length === 1 && !editingChildId && !isAddingNew) {
      setEditingChildId(children[0].id);
      const child = children[0];
      setChildName(child.nickname);
      const birthDate = new Date(child.birth_date);
      setChildBirthYear(birthDate.getFullYear().toString());
      setChildBirthMonth(
        (birthDate.getMonth() + 1).toString().padStart(2, '0'),
      );
      setChildBirthDay(birthDate.getDate().toString().padStart(2, '0'));
      setChildGender(child.gender);
    }
  }, [children, editingChildId, isAddingNew]);

  // 戻る処理
  const handleBack = () => {
    router.push('/app');
  };

  // 年齢計算
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // 子供編集
  const handleEditChild = (childId: string) => {
    const child = children.find((c) => c.id === childId);
    if (child) {
      setEditingChildId(childId);
      setChildName(child.nickname);
      const birthDate = new Date(child.birth_date);
      setChildBirthYear(birthDate.getFullYear().toString());
      setChildBirthMonth(
        (birthDate.getMonth() + 1).toString().padStart(2, '0'),
      );
      setChildBirthDay(birthDate.getDate().toString().padStart(2, '0'));
      setChildGender(child.gender);
    }
  };

  // 新規追加
  const handleAddNewChild = () => {
    setIsAddingNew(true);
    setEditingChildId(null);
    setChildName('');
    setChildBirthYear('');
    setChildBirthMonth('');
    setChildBirthDay('');
    setChildGender('');
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditingChildId(null);
    setIsAddingNew(false);
    setChildName('');
    setChildBirthYear('');
    setChildBirthMonth('');
    setChildBirthDay('');
    setChildGender('');
  };

  // 子供削除
  const handleDeleteChild = async (childId: string, childName: string) => {
    if (window.confirm(`${childName}の情報を削除しますか？`)) {
      setIsDeleting(childId);
      try {
        if (firebaseUser) {
          await deleteChildProfile(childId, firebaseUser);
          await refetch();
          alert('お子さんの情報を削除しました');
        }
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました。もう一度お試しください。');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // ローディング中（認証）
  if (authLoading || childrenLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  // 認証されていない場合
  if (!firebaseUser) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>認証中...</p>
      </div>
    );
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

    if (!firebaseUser) return;

    setIsSubmitting(true);
    try {
      // 誕生日をDate型に変換
      const birthDate = new Date(
        parseInt(childBirthYear),
        parseInt(childBirthMonth) - 1,
        parseInt(childBirthDay),
      );

      const childData = {
        nickname: childName,
        birth_date: birthDate.toISOString().split('T')[0], // YYYY-MM-DD形式
        gender: childGender,
      };

      if (isAddingNew) {
        // 新規作成
        await createChild(childData, firebaseUser);
        alert('お子さんの情報を追加しました！');
        handleCancelEdit();
      } else if (editingChildId) {
        // 編集
        await updateChildProfile(editingChildId, childData, firebaseUser);
        alert('お子さんの情報を更新しました！');
        handleCancelEdit();
      }

      await refetch();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={commonStyles.page.container}>
      <HamburgerMenu />

      {/* ← もどる */}
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

      <div style={commonStyles.page.mainContent}>
        <SpeechBubble
          text={
            isAddingNew
              ? '新しいお子さんの情報を入力してください！'
              : editingChildId
                ? 'お子さんの情報を編集できます！'
                : 'お子さんの情報を管理できます！'
          }
        />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
        </div>

        {/* 子供一覧表示（編集モードでない場合） */}
        {!editingChildId && !isAddingNew && (
          <div
            style={{
              backgroundColor: colors.background.white,
              borderRadius: '16px',
              padding: spacing.xl,
              boxShadow: colors.shadow.heavy,
              maxWidth: '500px',
              width: '100%',
              margin: `${spacing.lg} 0`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg,
              }}
            >
              <h1
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.xl,
                  fontWeight: 'bold',
                  margin: 0,
                }}
              >
                お子さんの管理
              </h1>
              <button
                onClick={handleAddNewChild}
                style={{
                  background: colors.primary,
                  color: colors.text.white,
                  border: 'none',
                  borderRadius: borderRadius.button,
                  padding: `${spacing.sm} ${spacing.md}`,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                + 追加
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.md,
              }}
            >
              {children.map((child) => (
                <div
                  key={child.id}
                  style={{
                    border: `2px solid ${colors.primary}`,
                    borderRadius: borderRadius.medium,
                    padding: spacing.lg,
                    backgroundColor: colors.background.light,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: spacing.sm,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          color: colors.text.primary,
                          fontSize: fontSize.xl,
                          fontWeight: 'bold',
                          margin: 0,
                          marginBottom: spacing.xs,
                        }}
                      >
                        {child.nickname}
                      </h3>
                      <p
                        style={{
                          color: colors.text.secondary,
                          fontSize: fontSize.base,
                          margin: 0,
                        }}
                      >
                        {calculateAge(child.birth_date)}歳 • {child.gender}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: spacing.sm }}>
                      <button
                        onClick={() => handleEditChild(child.id)}
                        style={{
                          background: colors.secondary,
                          color: colors.text.white,
                          border: 'none',
                          borderRadius: borderRadius.small,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          fontSize: fontSize.small,
                          cursor: 'pointer',
                        }}
                      >
                        編集
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteChild(child.id, child.nickname)
                        }
                        disabled={isDeleting === child.id}
                        style={{
                          background:
                            isDeleting === child.id
                              ? colors.text.secondary
                              : colors.text.error,
                          color: colors.text.white,
                          border: 'none',
                          borderRadius: borderRadius.small,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          fontSize: fontSize.small,
                          cursor:
                            isDeleting === child.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isDeleting === child.id ? '削除中...' : '削除'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 編集/追加フォーム */}
        {(editingChildId || isAddingNew) && (
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
              {isAddingNew ? 'お子さんの情報を追加' : 'お子さんの情報を編集'}
            </h1>

            <form onSubmit={handleSubmit}>
              {/* 名前 */}
              <div style={{ marginBottom: spacing.lg }}>
                <label
                  style={{
                    display: 'block',
                    color: colors.text.primary,
                    fontSize: fontSize.base,
                    fontWeight: 'bold',
                    marginBottom: spacing.sm,
                  }}
                >
                  おなまえ
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
                    }}
                  >
                    <option value="">年</option>
                    {Array.from(
                      { length: 18 },
                      (_, i) => new Date().getFullYear() - i,
                    ).map((year) => (
                      <option key={year} value={year}>
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
                    }}
                  >
                    <option value="">月</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <option
                          key={month}
                          value={month.toString().padStart(2, '0')}
                        >
                          {month}月
                        </option>
                      ),
                    )}
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
                    }}
                  >
                    <option value="">日</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day.toString().padStart(2, '0')}>
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
                  }}
                >
                  <option value="">せいべつ（こたえなくてもOKだよ）</option>
                  {['おとこのこ', 'おんなのこ', 'こたえない'].map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  display: 'flex',
                  gap: spacing.md,
                  justifyContent: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: colors.text.secondary,
                    color: colors.text.white,
                    border: 'none',
                    borderRadius: borderRadius.button,
                    padding: `${spacing.md} ${spacing.xl}`,
                    fontSize: fontSize.large,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    minWidth: '120px',
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!childName.trim() || isSubmitting}
                  style={{
                    background: colors.primary,
                    color: colors.text.white,
                    border: 'none',
                    borderRadius: borderRadius.button,
                    padding: `${spacing.md} ${spacing.xl}`,
                    fontSize: fontSize.large,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    minWidth: '120px',
                  }}
                >
                  {isSubmitting
                    ? '保存中...'
                    : isAddingNew
                      ? '追加する'
                      : '更新する'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
