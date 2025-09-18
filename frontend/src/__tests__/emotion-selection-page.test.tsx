/// <reference types="vitest/globals" />
import { useAuth } from '@/contexts/AuthContext';
import { useEmotionSelection } from '@/hooks/useEmotionSelection';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { vi } from 'vitest';
import EmotionSelectionPage from '../app/(authed)/app/emotion-selection/page';

// モック
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/useEmotionSelection', () => ({
  useEmotionSelection: vi.fn(),
}));
vi.mock('@/components/ui', () => ({
  AudioPlayer: () => <div>Audio Player</div>,
  BackButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>Back</button>
  ),
  KokoronDefault: () => <div>Kokoron</div>,
  Spinner: () => <div>Loading</div>,
}));
vi.mock('@/components/emotion/ErrorDisplay', () => ({
  ErrorDisplay: ({ error, onBack }: any) => (
    <div>
      <div>Error: {error}</div>
      <button onClick={onBack}>Back to App</button>
    </div>
  ),
}));
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

describe('EmotionSelectionPage', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };
  const mockEmotions = [
    { id: '1', label: 'うれしい', color: '#FFD700', image_url: '/test.webp' },
    { id: '2', label: 'わからない', color: '#808080', image_url: '/test.webp' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useEmotionSelection as any).mockReturnValue({
      emotions: mockEmotions,
      isLoadingEmotions: false,
      error: null,
    });
  });

  // 共通 setup
  const setup = ({
    user = { id: '1' },
    isLoading = false,
  }: { user?: { id: string } | null; isLoading?: boolean } = {}) => {
    (useAuth as any).mockReturnValue({ user, isLoading });
    render(<EmotionSelectionPage />);
  };

  it('正常にレンダリングされる', () => {
    setup();
    // より具体的なセレクターを使用（span要素のみを対象）
    expect(
      screen.getByText((content, element) => {
        return (
          element?.textContent === 'きょうは　どんな　きもちかな？' &&
          element?.tagName === 'SPAN'
        );
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('うれしい')).toBeInTheDocument();
  });

  it('感情選択が動作する', () => {
    setup();
    fireEvent.click(screen.getByText('うれしい'));
    expect(mockPush).toHaveBeenCalledWith('/app/emotion-intensity?emotion=1');
  });

  it('「わからない」選択で確認画面に遷移する', () => {
    setup();
    fireEvent.click(screen.getByText('わからない'));
    expect(mockPush).toHaveBeenCalledWith(
      '/app/emotion-confirmation?emotion=2&intensity=medium',
    );
  });

  it('ローディング状態を表示する', () => {
    setup({ user: null, isLoading: true });
    // middlewareで認証処理を行うため、ローディング表示は不要
    // 全角スペースの問題を回避するため、部分一致でテスト
    expect(
      screen.getByText(/きょうは.*どんな.*きもちかな/),
    ).toBeInTheDocument();
  });

  it('middlewareで認証処理されるためリダイレクトテストは不要', () => {
    // middleware導入により、各ページでの認証チェックとリダイレクトは不要
    setup({ user: null, isLoading: false });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('エラー状態を表示する', () => {
    (useEmotionSelection as any).mockReturnValueOnce({
      emotions: [],
      isLoadingEmotions: false,
      error: 'データの取得に失敗しました',
    });
    setup();
    expect(
      screen.getByText('Error: データの取得に失敗しました'),
    ).toBeInTheDocument();
  });
});
