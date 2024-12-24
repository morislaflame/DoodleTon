import { useState, useEffect } from 'react';

export const useGyroscope = () => {
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);

  useEffect(() => {
    const tg = window.Telegram.WebApp;
    
    if (tg.Gyroscope) {
      tg.Gyroscope.start({ refresh_rate: 60 });

      const handleOrientation = () => {
        const y = tg.Gyroscope.y;
        
        // Определяем пороговые значения для наклона
        const threshold = 0.3;
        
        setIsMovingLeft(y > threshold);
        setIsMovingRight(y < -threshold);
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