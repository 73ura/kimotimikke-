'use client';

import { useChildren } from '@/hooks/useChildren';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface Child {
  id: string;
  nickname: string;
  birth_date: string;
  gender: string;
  created_at: string;
  updated_at: string;
}

interface ChildContextType {
  selectedChild: Child | null;
  children: Child[];
  switchToChild: (childId: string) => void;
  switchToNextChild: () => void;
  switchToPreviousChild: () => void;
  currentChildIndex: number;
  isLoading: boolean;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

interface ChildProviderProps {
  children: ReactNode;
}

export const ChildProvider: React.FC<ChildProviderProps> = ({ children }) => {
  const { children: childrenData, loading } = useChildren();
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  // 子供データが読み込まれたら、最初の子供を自動選択
  useEffect(() => {
    if (childrenData.length > 0 && !selectedChild) {
      setSelectedChild(childrenData[0]);
    }
  }, [childrenData, selectedChild]);

  // 選択された子供が削除された場合の処理
  useEffect(() => {
    if (selectedChild && childrenData.length > 0) {
      const childExists = childrenData.find(
        (child) => child.id === selectedChild.id,
      );
      if (!childExists) {
        // 選択された子供が存在しない場合、最初の子供を選択
        setSelectedChild(childrenData[0]);
      }
    } else if (childrenData.length === 0) {
      // 子供がいない場合
      setSelectedChild(null);
    }
  }, [childrenData, selectedChild]);

  const switchToChild = (childId: string) => {
    const child = childrenData.find((c) => c.id === childId);
    if (child) {
      setSelectedChild(child);
    }
  };

  const switchToNextChild = () => {
    if (childrenData.length <= 1) return;

    const currentIndex = childrenData.findIndex(
      (child) => child.id === selectedChild?.id,
    );
    const nextIndex = (currentIndex + 1) % childrenData.length;
    setSelectedChild(childrenData[nextIndex]);
  };

  const switchToPreviousChild = () => {
    if (childrenData.length <= 1) return;

    const currentIndex = childrenData.findIndex(
      (child) => child.id === selectedChild?.id,
    );
    const prevIndex =
      currentIndex === 0 ? childrenData.length - 1 : currentIndex - 1;
    setSelectedChild(childrenData[prevIndex]);
  };

  const currentChildIndex = selectedChild
    ? childrenData.findIndex((child) => child.id === selectedChild.id)
    : -1;

  const value: ChildContextType = {
    selectedChild,
    children: childrenData,
    switchToChild,
    switchToNextChild,
    switchToPreviousChild,
    currentChildIndex,
    isLoading: loading,
  };

  return (
    <ChildContext.Provider value={value}>{children}</ChildContext.Provider>
  );
};

export const useChildContext = (): ChildContextType => {
  const context = useContext(ChildContext);
  if (context === undefined) {
    throw new Error('useChildContext must be used within a ChildProvider');
  }
  return context;
};
