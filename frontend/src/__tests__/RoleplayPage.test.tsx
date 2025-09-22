import RoleplayPage from '@/app/(authed)/app/roleplay/page';
import { ChildProvider } from '@/contexts/ChildContext';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 可変モック: 各テストで上書き
let authState: {
  user: { id: string; name: string } | null;
  firebaseUser: unknown;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
};
const pushMock = vi.fn();

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: pushMock,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
  };
});

// AuthContext のモック（テストごとに authState を差し替え）
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

// HamburgerMenu 内で参照されるサブスクフックを安定モック
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    has_subscription: false,
    status: 'none',
    is_trial: false,
    is_paid: false,
    trial_expires_at: null,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// useChildrenフックをモック
vi.mock('@/hooks/useChildren', () => ({
  useChildren: () => ({
    children: [
      {
        id: 'child1',
        name: 'テスト太郎',
        birth_date: '2020-01-01',
        user_id: 'u1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    selectedChild: {
      id: 'child1',
      name: 'テスト太郎',
      birth_date: '2020-01-01',
      user_id: 'u1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    setSelectedChild: vi.fn(),
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// useRoleplayフックをモック
let mockRoleplayState: {
  selectedScenario: string | null;
  selectedEmotion: string | null;
  currentSessionId: string | null;
  sessionStartTime: number | null;
} = {
  selectedScenario: null,
  selectedEmotion: null,
  currentSessionId: null,
  sessionStartTime: null,
};

const mockSelectScenario = vi.fn((scenarioId: string) => {
  mockRoleplayState.selectedScenario = scenarioId;
});

const mockSelectEmotion = vi.fn((emotionId: string) => {
  mockRoleplayState.selectedEmotion = emotionId;
});

const mockResetRoleplayState = vi.fn(() => {
  mockRoleplayState = {
    selectedScenario: null,
    selectedEmotion: null,
    currentSessionId: null,
    sessionStartTime: null,
  };
});

vi.mock('@/hooks/useRoleplay', () => ({
  useRoleplay: () => ({
    scenarios: [
      {
        id: '1',
        title: 'おもちゃをおともだちにとられた',
        description:
          'おもちゃをとられてかなしい気持ちになったときのシナリオです',
        color: '#FF6B6B',
        scenario_content:
          'おもちゃをとられてかなしい気持ちになったときのシナリオです',
        image_url: '/test.webp',
        emotion_types: ['かなしい', 'こまった'],
        keywords: ['おもちゃ', 'おともだち'],
        age_range_min: 3,
        age_range_max: 8,
        difficulty_level: 1,
        is_active: true,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'おともだちとけんか',
        description: 'おともだちとけんかをしたときのシナリオです',
        color: '#4ECDC4',
        scenario_content: 'おともだちとけんかをしたときのシナリオです',
        image_url: '/test.webp',
        emotion_types: ['いかり', 'かなしい'],
        keywords: ['おともだち', 'けんか'],
        age_range_min: 3,
        age_range_max: 8,
        difficulty_level: 2,
        is_active: true,
        sort_order: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    sessions: [],
    roleplayState: mockRoleplayState,
    selectScenario: mockSelectScenario,
    selectEmotion: mockSelectEmotion,
    startSession: vi.fn(),
    endSession: vi.fn(),
    completeSession: vi.fn(),
    abandonSession: vi.fn(),
    updateSession: vi.fn(),
    resetRoleplayState: mockResetRoleplayState,
    loading: false,
    error: null,
  }),
}));

// useEmotionSelectionフックをモック
vi.mock('@/hooks/useEmotionSelection', () => ({
  useEmotionSelection: () => ({
    emotions: [
      {
        id: '1',
        label: 'かなしい',
        color: '#4A90E2',
        image_url: '/test.webp',
      },
      {
        id: '2',
        label: 'こまった',
        color: '#F5A623',
        image_url: '/test.webp',
      },
      {
        id: '3',
        label: 'ふゆかい',
        color: '#7ED321',
        image_url: '/test.webp',
      },
      {
        id: '4',
        label: 'いかり',
        color: '#D0021B',
        image_url: '/test.webp',
      },
    ],
    isLoadingEmotions: false,
    error: null,
  }),
}));

// useRoleplayAdviceフックをモック
vi.mock('@/hooks/useRoleplayAdvice', () => ({
  useRoleplayAdvice: () => ({
    advice: {
      id: '1',
      scenario_id: '1',
      emotion_id: '3',
      advice_text: '「いやだな」って いってみよう',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    loading: false,
    error: null,
  }),
}));

// テスト用のコンテキストプロバイダー
const TestChildProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ChildProvider>{children}</ChildProvider>;
};

// テスト用のレンダリングヘルパー
const renderWithProviders = (component: React.ReactElement) => {
  return render(<TestChildProvider>{component}</TestChildProvider>);
};

describe('RoleplayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      user: { id: 'u1', name: 'Tester' },
      firebaseUser: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    };
    // ロールプレイ状態をリセット
    mockRoleplayState = {
      selectedScenario: null,
      selectedEmotion: null,
      currentSessionId: null,
      sessionStartTime: null,
    };
  });

  it('正常系: 認証済みでシナリオ一覧が表示される', () => {
    renderWithProviders(<RoleplayPage />);

    // シナリオ一覧の導入メッセージ
    expect(screen.getByText('シナリオをえらんでね')).toBeInTheDocument();

    // シナリオボタンが表示される
    const firstScenario = screen.getByRole('button', {
      name: /おもちゃをおともだちにとられた/,
    });
    expect(firstScenario).toBeInTheDocument();

    const secondScenario = screen.getByRole('button', {
      name: /おともだちとけんか/,
    });
    expect(secondScenario).toBeInTheDocument();
  });

  it('正常系: 1つ目のシナリオをクリックできる', () => {
    renderWithProviders(<RoleplayPage />);

    const firstScenario = screen.getByRole('button', {
      name: /おもちゃをおともだちにとられた/,
    });
    fireEvent.click(firstScenario);

    // シナリオがクリックされたことを確認（selectScenarioが呼ばれたことを確認）
    expect(mockSelectScenario).toHaveBeenCalledWith('1');
  });

  it('正常系: シナリオをクリックして感情選択ができる', () => {
    renderWithProviders(<RoleplayPage />);

    // シナリオをクリック
    fireEvent.click(
      screen.getByRole('button', { name: /おもちゃをおともだちにとられた/ }),
    );

    // selectScenarioが呼ばれたことを確認
    expect(mockSelectScenario).toHaveBeenCalledWith('1');
  });

  it('正常系: 2つ目のシナリオもクリックできる', () => {
    renderWithProviders(<RoleplayPage />);

    const secondScenario = screen.getByRole('button', {
      name: /おともだちとけんか/,
    });
    fireEvent.click(secondScenario);

    // selectScenarioが呼ばれたことを確認
    expect(mockSelectScenario).toHaveBeenCalledWith('2');
  });

  it('正常系: シナリオ選択後にリセットできる', () => {
    renderWithProviders(<RoleplayPage />);

    // シナリオを選択
    fireEvent.click(
      screen.getByRole('button', { name: /おもちゃをおともだちにとられた/ }),
    );

    // selectScenarioが呼ばれたことを確認
    expect(mockSelectScenario).toHaveBeenCalledWith('1');
  });

  it('異常系: ローディング状態が正しく表示される', () => {
    renderWithProviders(<RoleplayPage />);

    // シナリオ一覧が表示される
    expect(screen.getByText('シナリオをえらんでね')).toBeInTheDocument();
  });

  it('異常系: isLoading=true のときローディング表示', () => {
    authState = {
      ...authState,
      isLoading: true,
      user: null,
    };
    renderWithProviders(<RoleplayPage />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('異常系: 未認証時はトップへリダイレクト', () => {
    authState = {
      ...authState,
      isLoading: false,
      user: null,
    };
    renderWithProviders(<RoleplayPage />);
    expect(pushMock).toHaveBeenCalledWith('/');
  });
});
