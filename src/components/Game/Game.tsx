import React, { useCallback, useRef, useState } from 'react';
import { Player } from '../Player/Player';
import { Platform } from '../Platform/Platform';
import { GameOver } from '../GameOver/GameOver';
import { GAME_CONFIG } from '../../utils/constants';
import { useKeyPress } from '../../hooks/useKeyPress';
import { checkPlatformCollision, handlePlatformCollision } from '../../utils/collision';
import { useGameLoop } from '../../hooks/useGameLoop';
import './Game.styles.css';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [player] = useState<Player>(new Player());
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [score, setScore] = useState(0);
  const gameOverScreen = useRef<GameOver | null>(null);
  const [cameraOffset, setCameraOffset] = useState(0);
  
  const leftPressed = useKeyPress('ArrowLeft');
  const rightPressed = useKeyPress('ArrowRight');

  // Генерация начальных платформ
  const generateInitialPlatforms = useCallback(() => {
    const newPlatforms: Platform[] = [];
    newPlatforms.push(new Platform(0, {
      x: GAME_CONFIG.GAME_WIDTH / 2 - GAME_CONFIG.PLATFORM_WIDTH / 2,
      y: 50
    }));

    // Генерируем остальные платформы
    for (let i = 1; i < GAME_CONFIG.PLATFORM_COUNT; i++) {
      newPlatforms.push(new Platform(
        i,
        {
          x: Math.random() * (GAME_CONFIG.GAME_WIDTH - GAME_CONFIG.PLATFORM_WIDTH),
          y: 50 + (GAME_CONFIG.GAME_HEIGHT / (GAME_CONFIG.PLATFORM_COUNT + 2)) * i
        },
        Math.random() < 0.8 ? 'normal' : 'moving'
      ));
    }
    setPlatforms(newPlatforms);
  }, []);

  const calculatePlatformGap = useCallback((height: number) => {
    // Начальный разброс
    const minGap = 30;
    const maxGap = 100;
    
    // Увеличиваем разброс с высотой
    const heightFactor = Math.min(height / 10000, 1); // Максимальный эффект на высоте 10000
    const currentMinGap = minGap + (heightFactor * 20); // Минимальный разрыв увеличивается до 50
    const currentMaxGap = maxGap + (heightFactor * 50); // Максимальный разрыв увеличивается до 150
    
    // Проверяем, чтобы разрыв не превышал максимальную высоту прыжка
    const maxJumpHeight = (GAME_CONFIG.JUMP_FORCE * GAME_CONFIG.JUMP_FORCE) / (2 * GAME_CONFIG.GRAVITY);
    const safeMaxGap = Math.min(currentMaxGap, maxJumpHeight * 0.7); // Уменьшаем до 70% от максимальной высоты прыжка
    
    return currentMinGap + Math.random() * (safeMaxGap - currentMinGap);
  }, []);

  // Обновляем функцию генерации новых платформ
  const generatePlatform = useCallback((yPosition: number) => {
    const platformType = Math.random();
    let type: 'normal' | 'moving' | 'breaking';
    
    // Увеличиваем шанс появления специальных платформ с высотой
    const heightFactor = Math.min(yPosition / 10000, 1);
    
    // Интерполируем шансы между начальными и максимальными значениями
    const normalChance = GAME_CONFIG.PLATFORM_CHANCES.INITIAL.NORMAL - 
      (GAME_CONFIG.PLATFORM_CHANCES.INITIAL.NORMAL - GAME_CONFIG.PLATFORM_CHANCES.MAX_HEIGHT_FACTOR.NORMAL) * heightFactor;
    
    const movingChance = GAME_CONFIG.PLATFORM_CHANCES.INITIAL.MOVING + 
      (GAME_CONFIG.PLATFORM_CHANCES.MAX_HEIGHT_FACTOR.MOVING - GAME_CONFIG.PLATFORM_CHANCES.INITIAL.MOVING) * heightFactor;
    
    if (platformType < normalChance) {
      type = 'normal';
    } else if (platformType < normalChance + movingChance) {
      type = 'moving';
    } else {
      type = 'breaking';
    }
  
    return new Platform(
      Date.now(),
      {
        x: Math.random() * (GAME_CONFIG.GAME_WIDTH - GAME_CONFIG.PLATFORM_WIDTH),
        y: yPosition
      },
      type
    );
  }, []);

  // Отрисовка на canvas
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, GAME_CONFIG.GAME_WIDTH, GAME_CONFIG.GAME_HEIGHT);
    
    if (gameOver) {
      if (!gameOverScreen.current) {
        gameOverScreen.current = new GameOver(score);
      }
      gameOverScreen.current.draw(ctx);
      return;
    }
    
    // Сохраняем контекст перед трансформацией
    ctx.save();
    // Сдвигаем весь контекст на величину смещения камеры
    ctx.translate(0, cameraOffset);
    
    // Рисуем игровые объекты с учетом смещения
    player.draw(ctx);
    platforms.forEach(platform => platform.draw(ctx));
    
    ctx.restore();
    
    // Рисуем счет поверх всего (без смещения)
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
  }, [player, platforms, score, gameOver, cameraOffset]);

  const resetGame = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setCameraOffset(0);
    player.reset();
    generateInitialPlatforms();
    gameOverScreen.current = null;
  }, [generateInitialPlatforms, player]);

  const updateGame = useCallback((deltaTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gameOver) {
      draw(ctx);
      return;
    }

    player.update(deltaTime, leftPressed, rightPressed);

    // Обновляем смещение камеры только когда игрок поднимаетс выше
    const targetCameraOffset = player.position.y - GAME_CONFIG.GAME_HEIGHT / 2;
    if (targetCameraOffset > cameraOffset) {
      setCameraOffset(targetCameraOffset);
    }

    // Проверяем падение игрока относительно камеры
    const playerScreenPosition = player.position.y - cameraOffset;
    if (playerScreenPosition < 0) { // Игрок упал ниже экрана
      console.log('Game Over - player fell below screen');
      setGameOver(true);
      return;
    }

    // Обновляем игровую логику
    if (platforms.length === 0) {
      generateInitialPlatforms();
    }

    platforms.forEach(platform => {
      platform.update(deltaTime);
      const collision = checkPlatformCollision(player, platform);
      if (collision) {
        const { newVelocityY, shouldBreak } = handlePlatformCollision(player, platform);
        player.jump(newVelocityY);
        player.isJumping = false;
        
        if (shouldBreak) {
          platform.startBreaking();
        }
        
        setScore(prev => prev + 10);
      }
    });

    // Удаляем платформы, которые полностью разрушились
    setPlatforms(prev => prev.filter(platform => !platform.shouldBeRemoved()));

    // Генерируем новые платформы, если игрок поднялся достаточно высоко
    const highestPlatform = Math.max(...platforms.map(p => p.position.y));
    if (player.position.y + GAME_CONFIG.GAME_HEIGHT > highestPlatform) {
      const newPlatforms = [...platforms];
      let nextY = highestPlatform;
      
      for (let i = 0; i < 3; i++) {
        const gap = calculatePlatformGap(nextY);
        nextY += gap;
        newPlatforms.push(generatePlatform(nextY));
      }
      setPlatforms(newPlatforms);
    }

    // Удаляем платформы, которые ушли далеко вниз
    setPlatforms(prev => prev.filter(platform => 
      platform.position.y > player.position.y - GAME_CONFIG.GAME_HEIGHT
    ));

    draw(ctx);
  }, [platforms, leftPressed, rightPressed, draw, generateInitialPlatforms, player, gameOver, cameraOffset]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameOver || !gameOverScreen.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (gameOverScreen.current.isRestartButtonClicked(x, y)) {
      console.log('Restart button clicked');
      resetGame();
    }
  }, [gameOver, resetGame]);

  useGameLoop(updateGame, {
    fps: 60,
  });

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONFIG.GAME_WIDTH}
      height={GAME_CONFIG.GAME_HEIGHT}
      onClick={handleCanvasClick}
      className="game-canvas"
    />
  );
};

export default Game;