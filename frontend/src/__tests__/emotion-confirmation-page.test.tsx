/// <reference types="vitest/globals" />
import EmotionConfirmationPage from '../app/(authed)/app/emotion-confirmation/page';
import { useAuth } from '@/contexts/AuthContext';
import { useEmotionConfirmation } from '@/hooks/useEmotionConfirmation';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { vi } from 'vitest';

// モック
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/useEmotionConfirmation', () => ({
  useEmotionConfirmation: vi.fn(),
}));
vi.mock('@/components/ui', () => ({
  AudioPlayer: () => <div>Audio Player</div>,
  KokoronDefault: () => <div>Kokoron</div>,
  Spinner: () => <div>Loading</div>,
}));
vi.mock('@/components/emotion/EmotionCard', () => ({
  EmotionCard: ({ selectedEmotion, onTouchEnd }: any) => (
    <div onTouchEnd={onTouchEnd}>Emotion: {selectedEmotion?.label}</div>
  ),
}));

describe('EmotionConfirmationPage', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };
  const mockSelectedEmotion = { id: '1', label: 'うれしい' };
  const mockSelectedIntensity = { level: 'medium' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useEmotionConfirmation as any).mockReturnValue({
      selectedEmotion: mockSelectedEmotion,
      selectedIntensity: mockSelectedIntensity,
      children: [{ id: '1', name: 'テスト太郎' }],
      selectedChild: { id: '1', name: 'テスト太郎' },
      isLoadingData: false,
      error: null,
      swipeDirection: null,
      cardTransform: 'translateX(0px)',
      isDragging: false,
      cardRef: { current: null },
      handleTouchStart: vi.fn(),
      handleTouchMove: vi.fn(),
      handleTouchEnd: vi.fn(),
      saveEmotionLog: vi.fn(),
    });
  });

  // 共通 setup
  const setup = ({
    user = { id: '1' },
    isLoading = false,
  }: { user?: { id: string } | null; isLoading?: boolean } = {}) => {
    (useAuth as any).mockReturnValue({ user, isLoading });
    render(<EmotionConfirmationPage />);
  };

  it('正常にレンダリングされる', () => {
    setup();
    expect(screen.getByText('こんなきもちなんだね？')).toBeInTheDocument();
    expect(screen.getByText('Emotion: うれしい')).toBeInTheDocument();
  });

  it('ローディング状態を表示する', () => {
    setup({ user: null, isLoading: true });
    // middlewareで認証処理を行うため、ローディング表示は不要
    expect(screen.getByText('こんなきもちなんだね？')).toBeInTheDocument();
  });

  it('middlewareで認証処理されるためリダイレクトテストは不要', () => {
    // middleware導入により、各ページでの認証チェックとリダイレクトは不要
    setup({ user: null, isLoading: false });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('エラー状態を表示する', () => {
    (useEmotionConfirmation as any).mockReturnValueOnce({
      selectedEmotion: null,
      selectedIntensity: null,
      children: [],
      selectedChild: null,
      isLoadingData: false,
      error: 'データの取得に失敗しました',
      swipeDirection: null,
      cardTransform: 'translateX(0px)',
      isDragging: false,
      cardRef: { current: null },
      handleTouchStart: vi.fn(),
      handleTouchMove: vi.fn(),
      handleTouchEnd: vi.fn(),
      saveEmotionLog: vi.fn(),
    });
    setup();
    expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
  });
});
