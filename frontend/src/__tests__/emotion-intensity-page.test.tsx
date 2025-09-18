/// <reference types="vitest/globals" />
import EmotionIntensityPage from '../app/(authed)/app/emotion-intensity/page';
import { useAuth } from '@/contexts/AuthContext';
import { useEmotionIntensity } from '@/hooks/useEmotionIntensity';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { vi } from 'vitest';

// モック
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/useEmotionIntensity', () => ({
  useEmotionIntensity: vi.fn(),
}));
vi.mock('@/components/ui', () => ({
  AudioPlayer: () => <div>Audio Player</div>,
  KokoronDefault: () => <div>Kokoron</div>,
  Spinner: () => <div>Loading</div>,
}));
vi.mock('@/components/emotion/ErrorDisplay', () => ({
  ErrorDisplay: ({ error, onBack, title }: any) => (
    <div>
      <div>Error: {error}</div>
      <div>Title: {title}</div>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));
vi.mock('@/components/emotion/IntensityButton', () => ({
  IntensityButton: ({ intensity, onSelect }: any) => (
    <button onClick={() => onSelect(intensity)}>{intensity.level}</button>
  ),
}));

describe('EmotionIntensityPage', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };
  const mockSelectedEmotion = { id: '1', label: 'うれしい', color: '#FFD700' };
  const mockIntensities = [
    {
      id: 1,
      level: 'low',
      label: 'うれしい',
      description: '弱いうれしい',
      colorModifier: 0.5,
    },
    {
      id: 2,
      level: 'medium',
      label: 'うれしい',
      description: '中程度のうれしい',
      colorModifier: 1.0,
    },
    {
      id: 3,
      level: 'high',
      label: 'うれしい',
      description: '強いうれしい',
      colorModifier: 1.5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useEmotionIntensity as any).mockReturnValue({
      selectedEmotion: mockSelectedEmotion,
      intensities: mockIntensities,
      isLoadingEmotion: false,
      error: null,
    });
  });

  // 共通 setup
  const setup = ({
    user = { id: '1' },
    isLoading = false,
  }: { user?: { id: string } | null; isLoading?: boolean } = {}) => {
    (useAuth as any).mockReturnValue({ user, isLoading });
    render(<EmotionIntensityPage />);
  };

  it('正常にレンダリングされる', () => {
    setup();
    expect(screen.getByText('うれしい')).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return element?.textContent === 'このきもち　どのくらいかな？';
      }),
    ).toBeInTheDocument();
  });

  it('強度選択が動作する', () => {
    setup();
    fireEvent.click(screen.getByText('medium'));
    expect(mockPush).toHaveBeenCalledWith(
      '/app/emotion-confirmation?emotion=1&intensity=medium',
    );
  });

  it('戻るボタンが動作する', () => {
    setup();
    fireEvent.click(screen.getByText('← もどる'));
    expect(mockPush).toHaveBeenCalledWith('/app/emotion-selection');
  });

  it('ローディング状態を表示する', () => {
    setup({ user: null, isLoading: true });
    // middlewareで認証処理を行うため、ローディング表示は不要
    expect(screen.getByText('うれしい')).toBeInTheDocument();
  });

  it('middlewareで認証処理されるためリダイレクトテストは不要', () => {
    // middleware導入により、各ページでの認証チェックとリダイレクトは不要
    setup({ user: null, isLoading: false });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('エラー状態を表示する', () => {
    (useEmotionIntensity as any).mockReturnValueOnce({
      selectedEmotion: null,
      intensities: [],
      isLoadingEmotion: false,
      error: 'データの取得に失敗しました',
    });
    setup();
    expect(
      screen.getByText('Error: データの取得に失敗しました'),
    ).toBeInTheDocument();
  });
});
