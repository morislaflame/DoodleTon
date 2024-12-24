import { useState, useEffect, useRef } from 'react';

export const useGyroscope = () => {
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const lastY = useRef(0);
  const velocityY = useRef(0);
  
  useEffect(() => {
    const tg = window.Telegram.WebApp;
    
    if (tg.Gyroscope) {
      tg.Gyroscope.start({ refresh_rate: 60 });

      const handleOrientation = () => {
        const y = tg.Gyroscope.y;
        
        // Добавляем инерцию
        const targetVelocity = y;
        const velocitySmoothing = 0.1;
        velocityY.current += (targetVelocity - velocityY.current) * velocitySmoothing;
        
        // Применяем сглаживание
        const smoothingFactor = 0.1;
        const smoothedY = velocityY.current * smoothingFactor + lastY.current * (1 - smoothingFactor);
        lastY.current = smoothedY;
        
        // Определяем пороговые значения для наклона
        const threshold = 0.1; // Уменьшили порог до минимального значения
        
        // Инвертируем направление движения
        setIsMovingLeft(smoothedY < -threshold);
        setIsMovingRight(smoothedY > threshold);
      };

      // Запускаем проверку каждые 16мс (примерно 60fps)
      const interval = setInterval(handleOrientation, 16);

      return () => {
        clearInterval(interval);
        tg.Gyroscope.stop();
      };
    }
  }, []);

  return { isMovingLeft, isMovingRight };
};