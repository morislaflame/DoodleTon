import { useEffect, useRef, useCallback } from 'react';

interface GameLoopConfig {
  fps?: number;
}

export const useGameLoop = (
  callback: (deltaTime: number) => void,
  config: GameLoopConfig = {}
) => {
  const { fps = 60 } = config;
  
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const fpsInterval = useRef<number>(1000 / fps);
  
  const animate = useCallback((currentTime: number) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = currentTime;
    }

    const deltaTime = currentTime - previousTimeRef.current;

    if (deltaTime >= fpsInterval.current) {
      callback(deltaTime);
      previousTimeRef.current = currentTime - (deltaTime % fpsInterval.current);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [callback, fpsInterval]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);

  // Возвращаем методы для управления игровым циклом
  return {
    // Метод для принудительной остановки цикла
    stop: () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    },
    // Метод для сброса времени
    reset: () => {
      previousTimeRef.current = undefined;
    }
  };
};
