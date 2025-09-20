import { useCallback, useRef, useState } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // スワイプの最小距離（デフォルト: 50px）
  preventDefaultTouchmoveEvent?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

export const useSwipe = (options: SwipeOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = true,
  } = options;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
  });

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: true,
    });
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || !swipeState.isDragging) return;

      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      setSwipeState((prev) => ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
      }));
    },
    [swipeState.isDragging, preventDefaultTouchmoveEvent],
  );

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !swipeState.isDragging) return;

    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaY = swipeState.currentY - swipeState.startY;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // スワイプの判定（距離と時間の条件）
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
    const isLongEnough =
      Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold;
    const isFastEnough = deltaTime < 500; // 500ms以内

    if (isLongEnough && isFastEnough) {
      if (isHorizontalSwipe) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else if (isVerticalSwipe) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    // リセット
    touchStartRef.current = null;
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
    });
  }, [
    swipeState,
    threshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  ]);

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    swipeHandlers,
    swipeState,
  };
};
