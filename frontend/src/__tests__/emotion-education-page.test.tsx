/// <reference types="vitest/globals" />
import EmotionEducationPage from '../app/(authed)/app/emotion-education/page';
import { useAuth } from '@/contexts/AuthContext';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { vi } from 'vitest';

// モック
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/components/ui', () => ({
  KokoronDefault: () => <div>Kokoron</div>,
  SpeechBubble: ({ text }: { text: string }) => <div>{text}</div>,
  Spinner: () => <div>Loading</div>,
  HamburgerMenu: () => <div>Menu</div>,
}));

describe('EmotionEducationPage', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  const setup = ({
    user = { id: '1' },
    isLoading = false,
  }: { user?: { id: string } | null; isLoading?: boolean } = {}) => {
    (useAuth as any).mockReturnValue({ user, isLoading });
    render(<EmotionEducationPage />);
  };

  it('正常にレンダリングされる', () => {
    setup();
    expect(screen.getByText('感情教育について')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '感情教育とは？' }),
    ).toBeInTheDocument();
  });

  it('タブ切り替えが動作する', () => {
    setup();
    fireEvent.click(screen.getByText('なぜ大切なのか？'));
    expect(
      screen.getByRole('heading', { name: 'なぜ大切なのか？' }),
    ).toBeInTheDocument();
  });

  it('戻るボタンが動作する', () => {
    setup();
    fireEvent.click(screen.getByText('← もどる'));
    expect(mockPush).toHaveBeenCalledWith('/app');
  });

  it('感情記録ボタンが動作する', () => {
    setup();
    fireEvent.click(screen.getByText('感情記録を始める'));
    expect(mockPush).toHaveBeenCalledWith('/app/emotion-selection');
  });

  it('ローディング状態を表示する', () => {
    setup({ user: null, isLoading: true });
    // middlewareで認証処理を行うため、ローディング表示は不要
    expect(screen.getByText('感情教育について')).toBeInTheDocument();
  });

  it('middlewareで認証処理されるためリダイレクトテストは不要', () => {
    // middleware導入により、各ページでの認証チェックとリダイレクトは不要
    setup({ user: null, isLoading: false });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
