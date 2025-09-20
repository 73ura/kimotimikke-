// このフックは複数のフックを統合してロールプレイ全体を管理します。(シナリオ選択、感情選択、セッション開始・完了・中断、状態管理)
import { useMemo, useState } from 'react';
import { useChildren } from './useChildren';
import { useRoleplayAdvice } from './useRoleplayAdvice';
import { useRoleplayScenarios } from './useRoleplayScenarios';
import {
  useCreateRoleplaySession,
  useRoleplaySessions,
  useUpdateRoleplaySession,
} from './useRoleplaySessions';

export interface RoleplayState {
  selectedScenario: string | null;
  selectedEmotion: string | null;
  currentSessionId: string | null;
  sessionStartTime: number | null;
}

export const useRoleplay = (childId?: string) => {
  // 子供の情報を取得
  const { children } = useChildren();
  const currentChild = useMemo(
    () => children.find((child) => child.id === childId),
    [children, childId],
  );

  // 子供の年齢を計算
  const childAge = useMemo(() => {
    if (!currentChild?.birth_date) return undefined;
    const birthDate = new Date(currentChild.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }, [currentChild]);

  // シナリオ一覧を取得（子供の年齢に基づいてフィルタリング）
  // 1-2歳の場合は年齢制限を緩和して3歳以上のシナリオも表示
  const effectiveAge = childAge && childAge < 3 ? 3 : childAge;

  const {
    scenarios = [], // デフォルト値を空配列に設定
    loading: scenariosLoading,
    error: scenariosError,
  } = useRoleplayScenarios(
    effectiveAge,
    undefined, // 難易度は指定しない
    50,
    0,
  );

  // アドバイスを取得
  const {
    advice,
    loading: adviceLoading,
    error: adviceError,
  } = useRoleplayAdvice(
    '', // 初期値は空文字
    '',
  );

  // セッション一覧を取得
  const {
    sessions = [], // デフォルト値を空配列に設定
    loading: sessionsLoading,
    error: sessionsError,
  } = useRoleplaySessions(childId, 50, 0);

  // セッション作成・更新
  const {
    createSession,
    loading: createLoading,
    error: createError,
  } = useCreateRoleplaySession();
  const {
    updateSession,
    loading: updateLoading,
    error: updateError,
  } = useUpdateRoleplaySession();

  // ロールプレイ状態管理
  const [roleplayState, setRoleplayState] = useState<RoleplayState>({
    selectedScenario: null,
    selectedEmotion: null,
    currentSessionId: null,
    sessionStartTime: null,
  });

  // シナリオ選択
  const selectScenario = (scenarioId: string) => {
    setRoleplayState((prev) => ({
      ...prev,
      selectedScenario: scenarioId,
      selectedEmotion: null, // シナリオ変更時は感情選択をリセット
    }));
  };

  // 感情選択
  const selectEmotion = (emotionId: string | undefined) => {
    setRoleplayState((prev) => ({
      ...prev,
      selectedEmotion: emotionId,
    }));
  };

  // セッション開始
  const startSession = async (scenarioId?: string) => {
    const targetScenarioId = scenarioId || roleplayState.selectedScenario;
    if (!targetScenarioId || !childId) {
      throw new Error('シナリオと子供が選択されていません');
    }

    try {
      const sessionData = {
        child_id: childId,
        scenario_id: targetScenarioId,
        selected_emotion_id: roleplayState.selectedEmotion || undefined,
      };

      const response = await createSession(sessionData);
      const sessionId = response.id;

      setRoleplayState((prev) => ({
        ...prev,
        currentSessionId: sessionId,
        sessionStartTime: Date.now(),
      }));

      return response;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  };

  // セッション完了
  const completeSession = async (rating?: number, feedback?: string) => {
    if (!roleplayState.currentSessionId) {
      throw new Error('アクティブなセッションがありません');
    }

    try {
      const sessionDuration = roleplayState.sessionStartTime
        ? Math.floor((Date.now() - roleplayState.sessionStartTime) / 1000)
        : undefined;

      const updateData = {
        completion_status: 'completed' as const,
        selected_emotion_id: roleplayState.selectedEmotion || undefined,
        session_duration: sessionDuration,
        user_rating: rating,
        user_feedback: feedback,
      };

      const response = await updateSession(
        roleplayState.currentSessionId,
        updateData,
      );

      // セッション完了後は状態をリセット
      setRoleplayState({
        selectedScenario: null,
        selectedEmotion: null,
        currentSessionId: null,
        sessionStartTime: null,
      });

      return response;
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  };

  // セッション中断
  const abandonSession = async () => {
    if (!roleplayState.currentSessionId) {
      throw new Error('アクティブなセッションがありません');
    }

    try {
      const updateData = {
        completion_status: 'abandoned' as const,
      };

      const response = await updateSession(
        roleplayState.currentSessionId,
        updateData,
      );

      // セッション中断後は状態をリセット
      setRoleplayState({
        selectedScenario: null,
        selectedEmotion: null,
        currentSessionId: null,
        sessionStartTime: null,
      });

      return response;
    } catch (error) {
      console.error('Failed to abandon session:', error);
      throw error;
    }
  };

  // 状態リセット
  const resetRoleplayState = () => {
    setRoleplayState({
      selectedScenario: null,
      selectedEmotion: null,
      currentSessionId: null,
      sessionStartTime: null,
    });
  };

  // 選択されたシナリオの詳細を取得
  const selectedScenarioDetail = useMemo(
    () =>
      scenarios?.find(
        (scenario) => scenario.id === roleplayState.selectedScenario,
      ),
    [scenarios, roleplayState.selectedScenario],
  );

  // ローディング状態の統合
  const loading =
    scenariosLoading ||
    adviceLoading ||
    sessionsLoading ||
    createLoading ||
    updateLoading;

  // エラー状態の統合
  const error =
    scenariosError ||
    adviceError ||
    sessionsError ||
    createError ||
    updateError;

  return {
    // データ
    children,
    currentChild,
    childAge,
    scenarios,
    advice,
    sessions,
    selectedScenarioDetail,

    // 状態
    roleplayState,
    loading,
    error,

    // アクション
    selectScenario,
    selectEmotion,
    startSession,
    completeSession,
    abandonSession,
    updateSession,
    resetRoleplayState,
  };
};
