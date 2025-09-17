'use client';

import { auth as firebaseAuth } from '@/lib/firebase';
import type { UserResponse } from '@/types/api';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  user: UserResponse | null; // バックエンドユーザー
  firebaseUser: FirebaseUser | null; // Firebaseユーザー
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('=== AuthContext useEffect started ===');

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      console.log('=== onAuthStateChanged triggered ===');
      console.log(
        '1. Firebase user state changed:',
        fbUser ? 'User found' : 'No user',
      );

      setFirebaseUser(fbUser);
      if (fbUser) {
        console.log('2. Getting ID token');
        const idToken = await fbUser.getIdToken();
        console.log('3. ID token obtained, calling backend API');

        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
          if (!apiBaseUrl) {
            throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
          }

          const res = await fetch(`${apiBaseUrl}/api/v1/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: idToken }),
          });
          if (!res.ok) throw new Error('Failed to login to backend');
          const backendUser = await res.json();
          console.log('4. Backend API call successful, setting user');
          setUser(backendUser);
        } catch (error) {
          console.error('Backend login error:', error);
          setUser(null);
        }
      } else {
        console.log('2. No Firebase user, clearing backend user');
        setUser(null);
      }
      console.log('5. Setting isLoading to false');
      setIsLoading(false);
    });

    // 初期化完了をマーク
    setIsLoading(false);

    return () => unsubscribe();
  }, []);

  const login = async () => {
    console.log('=== AuthContext login() called ===');
    console.log('1. Creating GoogleAuthProvider');

    const provider = new GoogleAuthProvider();
    try {
      console.log('2. Calling signInWithPopup');
      await signInWithPopup(firebaseAuth, provider);
      console.log('3. signInWithPopup completed successfully');
    } catch (error) {
      console.error('Google login error', error);
    }
  };

  const logout = async () => {
    try {
      // Firebaseからサインアウトのみ実行
      // ローカル状態の更新は onAuthStateChanged に任せる
      await signOut(firebaseAuth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
