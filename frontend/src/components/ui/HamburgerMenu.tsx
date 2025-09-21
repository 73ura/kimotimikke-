'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useChildContext } from '@/contexts/ChildContext';
import { useSubscription } from '@/hooks/useSubscription';
import { animation, colors, spacing } from '@/styles/theme';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface HamburgerMenuProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  position?: 'left' | 'right';
  width?: string;
}

export default function HamburgerMenu({
  children,
  className = '',
  style = {},
  position = 'right',
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();
  const {
    selectedChild,
    children: childrenData,
    switchToChild,
  } = useChildContext();
  const {
    has_subscription,
    status,
    is_trial,
    loading: subLoading,
  } = useSubscription();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    closeMenu();
  };

  const handleLogout = async () => {
    try {
      closeMenu();
      await logout();
      // ログアウト完了後、直接リダイレクト
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // サブスクリプション状態に応じたメッセージ
  const getSubscriptionStatus = () => {
    if (subLoading) return '読み込み中...';

    // サブスクリプション会員でトライアル中
    if (has_subscription && (is_trial || status === 'trialing')) {
      return 'サブスクリプション無料体験中です！';
    }

    // サブスクリプション会員でトライアル終了
    if (has_subscription && status === 'active' && !is_trial) {
      return 'サブスクリプション会員です！';
    }

    // サブスクリプション会員じゃない
    return 'サブスクリプションに登録して全機能を使いましょう';
  };

  // ハンバーガーボタンのスタイル
  const hamburgerStyle: React.CSSProperties = {
    position: 'fixed',
    top: spacing.md,
    right: spacing.md,
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '3px',
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '6px',
    padding: '0',
    zIndex: 1001,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    ...style,
  };

  // ハンバーガーアイコンのスタイル
  const lineStyle: React.CSSProperties = {
    width: '24px',
    height: '3px',
    backgroundColor: colors.text.primary,
    borderRadius: '2px',
    transition: animation.transition,
    transformOrigin: 'center',
  };

  // ドロワーメニューのスタイル
  const drawerMenuStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    [position]: isOpen ? 0 : '-280px',
    width: '280px',
    height: '100vh',
    background: colors.background.white,
    boxShadow:
      position === 'right'
        ? '-2px 0 10px rgba(0, 0, 0, 0.1)'
        : '2px 0 10px rgba(0, 0, 0, 0.1)',
    transition: animation.transition,
    zIndex: 999,
  };

  // 閉じるボタンのスタイル
  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: spacing.md,
    [position === 'right' ? 'right' : 'left']: spacing.md,
    width: '30px',
    height: '30px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: colors.text.primary,
    zIndex: 1002,
  };

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={toggleMenu}
        style={hamburgerStyle}
        aria-label="メニューを開く"
        aria-expanded={isOpen}
        className={className}
      >
        <span style={lineStyle} />
        <span style={lineStyle} />
        <span style={lineStyle} />
      </button>

      {/* ドロワーメニュー */}
      <div style={drawerMenuStyle}>
        {/* 閉じるボタン */}
        <button
          onClick={closeMenu}
          style={closeButtonStyle}
          aria-label="メニューを閉じる"
        >
          ×
        </button>

        {/* メニューコンテンツ */}
        <div
          style={{
            padding: spacing.md,
            paddingTop: '60px',
            height: '100vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs,
          }}
        >
          {/* サブスクリプション状態表示 */}
          <div
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: spacing.sm,
              marginBottom: spacing.sm,
              border: '1px solid #e0e0e0',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: '#666',
                textAlign: 'center',
              }}
            >
              {getSubscriptionStatus()}
            </p>
          </div>

          {/* 使い方 */}
          <MenuItem onClick={() => handleNavigation('/app/usage')}>
            使い方
          </MenuItem>

          {/* 保護者向けTips */}
          <MenuItem onClick={() => handleNavigation('/app/tips')}>
            保護者向けTips
          </MenuItem>

          {/* レポートページの見かた */}
          <MenuItem onClick={() => handleNavigation('/app/report-guide')}>
            レポートページの見かた
          </MenuItem>

          {/* 感情教育について */}
          <MenuItem onClick={() => handleNavigation('/app/emotion-education')}>
            感情教育について
          </MenuItem>

          {/* 非認知能力について */}
          <MenuItem onClick={() => handleNavigation('/app/non-cognitive')}>
            非認知能力について
          </MenuItem>

          {/* プライバシーポリシー */}
          <MenuItem onClick={() => handleNavigation('/app/privacy')}>
            プライバシーポリシー
          </MenuItem>

          {/* FAQ */}
          <MenuItem onClick={() => handleNavigation('/app/faq')}>FAQ</MenuItem>

          {/* 設定 */}
          <MenuItem onClick={() => handleNavigation('/app/setting')}>
            設定
          </MenuItem>

          {/* レポート */}
          <MenuItem onClick={() => handleNavigation('/app/report')}>
            レポート
          </MenuItem>

          {/* 感情分析 */}
          <MenuItem onClick={() => handleNavigation('/app/emotion-analysis')}>
            感情分析
          </MenuItem>

          {/* ロールプレイ */}
          <MenuItem onClick={() => handleNavigation('/app/roleplay')}>
            ロールプレイ
          </MenuItem>

          {/* サブスクリプション管理 */}
          <MenuItem onClick={() => handleNavigation('/app/subscription')}>
            サブスクリプション管理
          </MenuItem>

          {/* 料金・解約について */}
          <MenuItem onClick={() => handleNavigation('/app/billing')}>
            料金・解約について
          </MenuItem>

          {/* 子供切り替え（複数の子供がいる場合のみ表示） */}
          {childrenData.length > 1 && (
            <>
              <div
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderTop: `1px solid ${colors.border.light}`,
                  borderBottom: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.background.light,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: colors.text.secondary,
                }}
              >
                子供を切り替え
              </div>
              {childrenData.map((child) => (
                <MenuItem
                  key={child.id}
                  onClick={() => {
                    switchToChild(child.id);
                    closeMenu();
                  }}
                  style={{
                    backgroundColor:
                      selectedChild?.id === child.id
                        ? colors.primary
                        : 'transparent',
                    color:
                      selectedChild?.id === child.id
                        ? colors.text.white
                        : colors.text.primary,
                  }}
                >
                  {child.nickname}ちゃん
                  {selectedChild?.id === child.id && ' ✓'}
                </MenuItem>
              ))}
            </>
          )}

          {/* カスタムコンテンツ */}
          {children}

          {/* ホームに戻る */}
          <MenuItem onClick={() => handleNavigation('/app')}>
            ホームに戻る
          </MenuItem>

          {/* ログアウト */}
          <MenuItem
            onClick={handleLogout}
            style={{
              color: '#f44336',
            }}
          >
            ログアウト
          </MenuItem>
        </div>
      </div>
    </>
  );
}

// メニューアイテム用のコンポーネント
interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function MenuItem({
  children,
  onClick,
  disabled = false,
  style = {},
}: MenuItemProps) {
  const itemStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.md} ${spacing.sm}`,
    background: 'none',
    border: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '1.4',
    color: colors.text.primary,
    transition: animation.transition,
    borderBottom: '1px solid #eee',
    borderRadius: '4px',
    marginBottom: spacing.xs,
    ...(disabled && {
      opacity: 0.5,
      cursor: 'not-allowed',
    }),
    ...style,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={itemStyle}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colors.primary;
          e.currentTarget.style.color = colors.text.white;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.text.primary;
        }
      }}
    >
      {children}
    </button>
  );
}
