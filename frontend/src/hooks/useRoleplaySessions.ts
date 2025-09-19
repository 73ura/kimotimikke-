import { useAuth } from '@/contexts/AuthContext';
import {
  createRoleplaySession,
  getRoleplaySession,
  getRoleplaySessions,
  updateRoleplaySession,
} from '@/lib/api';
import { useEffect, useState } from 'react';

interface FirebaseError {
  code: string;
  message: string;
}

function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

export interface RoleplaySession {
  id: string;
  user_id: string;
  child_id: string;
  scenario_id: string;
  emotion_log_id?: string;
  selected_emotion_id?: string;
  session_duration?: number;
  completion_status: 'started' | 'completed' | 'abandoned';
  user_rating?: number;
  user_feedback?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface RoleplaySessionsResponse {
  sessions: RoleplaySession[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateSessionData {
  child_id: string;
  scenario_id: string;
  emotion_log_id?: string;
  selected_emotion_id?: string;
}

export interface UpdateSessionData {
  session_duration?: number;
  completion_status?: 'started' | 'completed' | 'abandoned';
  user_rating?: number;
  user_feedback?: string;
}

export const useRoleplaySessions = (
  childId?: string,
  limit: number = 50,
  offset: number = 0,
) => {
  const { firebaseUser } = useAuth();
  const [sessions, setSessions] = useState<RoleplaySession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!firebaseUser) {
        setSessions([]);
        setTotal(0);
        setTimeout(() => setLoading(false), 100);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response: RoleplaySessionsResponse = await getRoleplaySessions(
          firebaseUser,
          childId,
          limit,
          offset,
        );
        setSessions(response.sessions);
        setTotal(response.total);
      } catch (err) {
        console.error('Failed to fetch roleplay sessions:', err);

        if (isFirebaseError(err) && err.code === 'auth/quota-exceeded') {
          console.warn('Firebase quota exceeded - 空の配列を返します');
          setSessions([]);
          setTotal(0);
          setError(
            'Firebase quota exceeded - しばらく待ってから再試行してください',
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to fetch roleplay sessions',
          );
          setSessions([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [firebaseUser, childId, limit, offset]);

  return { sessions, total, loading, error };
};

export const useRoleplaySession = (sessionId: string) => {
  const { firebaseUser } = useAuth();
  const [session, setSession] = useState<RoleplaySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!firebaseUser || !sessionId) {
        setSession(null);
        setTimeout(() => setLoading(false), 100);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getRoleplaySession(sessionId, firebaseUser);
        setSession(response);
      } catch (err) {
        console.error('Failed to fetch roleplay session:', err);

        if (isFirebaseError(err) && err.code === 'auth/quota-exceeded') {
          console.warn('Firebase quota exceeded - nullを返します');
          setSession(null);
          setError(
            'Firebase quota exceeded - しばらく待ってから再試行してください',
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to fetch roleplay session',
          );
          setSession(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [firebaseUser, sessionId]);

  return { session, loading, error };
};

export const useCreateRoleplaySession = () => {
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = async (sessionData: CreateSessionData) => {
    if (!firebaseUser) {
      throw new Error('Firebase user not available');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await createRoleplaySession(sessionData, firebaseUser);
      return response;
    } catch (err) {
      console.error('Failed to create roleplay session:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to create roleplay session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createSession, loading, error };
};

export const useUpdateRoleplaySession = () => {
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSession = async (
    sessionId: string,
    updateData: UpdateSessionData,
  ) => {
    if (!firebaseUser) {
      throw new Error('Firebase user not available');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await updateRoleplaySession(
        sessionId,
        updateData,
        firebaseUser,
      );
      return response;
    } catch (err) {
      console.error('Failed to update roleplay session:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update roleplay session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateSession, loading, error };
};
