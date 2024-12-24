import { useState, useEffect, useRef } from 'react';

export const useGyroscope = () => {
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const [movementIntensity, setMovementIntensity] = useState(0);
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
        
        // Определяем направление и интенсивность движения
        setIsMovingLeft(smoothedY < 0);
        setIsMovingRight(smoothedY > 0);
        setMovementIntensity(Math.abs(smoothedY));
      };

      const interval = setInterval(handleOrientation, 16);

      return () => {
        clearInterval(interval);
        tg.Gyroscope.stop();
      };
    }
  }, []);

  return { 
    isMovingLeft, 
    isMovingRight,
    movementIntensity 
  };
};