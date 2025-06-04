'use client';

import { useRef, useEffect, RefObject } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchmoveEvent?: boolean;
}

interface TouchCoordinates {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGestures<T extends HTMLElement>(
  config: SwipeConfig
): RefObject<T | null> {
  const elementRef = useRef<T>(null);
  const touchStart = useRef<TouchCoordinates | null>(null);
  const touchEnd = useRef<TouchCoordinates | null>(null);

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false
  } = config;

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchEnd.current = null;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;

    // Minimum swipe distance
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      return;
    }

    // Maximum swipe time (to prevent slow drags)
    if (deltaTime > 500) {
      return;
    }

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }

    // Reset
    touchStart.current = null;
    touchEnd.current = null;
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold, preventDefaultTouchmoveEvent, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}

// Hook for advanced gesture recognition
export function useAdvancedGestures<T extends HTMLElement>(config: {
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  onLongPress?: (x: number, y: number) => void;
  longPressDelay?: number;
}): RefObject<T | null> {
  const elementRef = useRef<T>(null);
  const touchesRef = useRef<Touch[]>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const initialAngleRef = useRef<number | null>(null);

  const { onPinch, onRotate, onLongPress, longPressDelay = 500 } = config;

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchesRef.current = Array.from(e.touches);

    // Long press detection for single touch
    if (e.touches.length === 1 && onLongPress) {
      const touch = e.touches[0];
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(touch.clientX, touch.clientY);
        if (navigator.vibrate) {
          navigator.vibrate(50); // Haptic feedback
        }
      }, longPressDelay);
    }

    // Initialize pinch/rotate for two touches
    if (e.touches.length === 2) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistanceRef.current = getDistance(touch1, touch2);
      initialAngleRef.current = getAngle(touch1, touch2);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchesRef.current = Array.from(e.touches);

    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle pinch/rotate for two touches
    if (e.touches.length === 2 && initialDistanceRef.current && initialAngleRef.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      if (onPinch) {
        const currentDistance = getDistance(touch1, touch2);
        const scale = currentDistance / initialDistanceRef.current;
        onPinch(scale);
      }

      if (onRotate) {
        const currentAngle = getAngle(touch1, touch2);
        const angleDiff = currentAngle - initialAngleRef.current;
        onRotate(angleDiff);
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    touchesRef.current = Array.from(e.touches);

    // Cancel long press
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Reset pinch/rotate when less than 2 touches
    if (e.touches.length < 2) {
      initialDistanceRef.current = null;
      initialAngleRef.current = null;
    }
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [longPressDelay, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh<T extends HTMLElement>(
  onRefresh: () => Promise<void> | void,
  threshold: number = 80
): RefObject<T | null> {
  const elementRef = useRef<T>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    if (isRefreshingRef.current) return;
    
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isRefreshingRef.current || !startYRef.current) return;

    const touch = e.touches[0];
    currentYRef.current = touch.clientY;
    const deltaY = currentYRef.current - startYRef.current;

    // Only trigger if at top of scroll and pulling down
    const element = elementRef.current;
    if (element && element.scrollTop === 0 && deltaY > 0) {
      const pullDistance = Math.min(deltaY, threshold * 1.5);
      element.style.transform = `translateY(${pullDistance * 0.5}px)`;
      element.style.transition = 'none';

      // Add visual feedback
      if (deltaY > threshold) {
        element.style.filter = 'brightness(1.1)';
      } else {
        element.style.filter = 'none';
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshingRef.current || !startYRef.current || !currentYRef.current) return;

    const deltaY = currentYRef.current - startYRef.current;
    const element = elementRef.current;

    if (element) {
      element.style.transition = 'transform 0.3s ease, filter 0.3s ease';
      element.style.transform = 'translateY(0)';
      element.style.filter = 'none';

      if (deltaY > threshold) {
        isRefreshingRef.current = true;
        
        // Add haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }

        try {
          await onRefresh();
        } finally {
          isRefreshingRef.current = false;
        }
      }
    }

    startYRef.current = null;
    currentYRef.current = null;
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}
