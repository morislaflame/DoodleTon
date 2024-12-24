import { useState, useEffect, useRef } from 'react';

export const useGyroscope = () => {
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const lastY = useRef(0);
  
  useEffect(() => {
    const tg = window.Telegram.WebApp;
    
    if (tg.Gyroscope) {
      tg.Gyroscope.start({ refresh_rate: 60 });

      const handleOrientation = () => {
        const y = tg.Gyroscope.y;
        
        // Применяем сглаживание
        const smoothingFactor = 0.2;
        const smoothedY = y * smoothingFactor + lastY.current * (1 - smoothingFactor);
        lastY.current = smoothedY;
        
        // Определяем пороговые значения для наклона
        const threshold = 0.2;
        
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