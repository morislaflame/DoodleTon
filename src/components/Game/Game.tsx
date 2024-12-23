import React, { useCallback, useRef, useState } from 'react';
import { Player } from '../Player/Player';
import { Platform } from '../Platform/Platform';
import { GameOver } from '../GameOver/GameOver';
import { GAME_CONFIG } from '../../utils/constants';
import { useKeyPress } from '../../hooks/useKeyPress';
import { checkPlatformCollision, handlePlatformCollision } from '../../utils/collision';
import { useGameLoop } from '../../hooks/useGameLoop';
import './Game.styles.css';
import { Enemy } from '../Enemy/Enemy';
import { checkEnemyCollision } from '../../utils/collision';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [player] = useState<Player>(new Player());
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [score, setScore] = useState(0);
  const gameOverScreen = useRef<GameOver | null>(null);
  const [cameraOffset, setCameraOffset] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  
  const leftPressed = useKeyPress('ArrowLeft');
  const rightPressed = useKeyPress('ArrowRight');

  // Генерация начальных платформ
  const generateInitialPlatforms = useCallback(() => {
    const maxJumpHeight = (GAME_CONFIG.JUMP_FORCE * GAME_CONFIG.JUMP_FORCE) / (2 * GAME_CONFIG.GRAVITY);
    const minBoostGap = maxJumpHeight * 0.7;
    const newPlatforms: Platform[] = [];
    let previousHadBoost = false;
    
    newPlatforms.push(new Platform(0, {
      x: GAME_CONFIG.GAME_WIDTH / 2 - GAME_CONFIG.PLATFORM_WIDTH / 2,
      y: 50
    }));

    for (let i = 1; i < GAME_CONFIG.PLATFORM_COUNT; i++) {
      let y = 50 + (GAME_CONFIG.GAME_HEIGHT / (GAME_CONFIG.PLATFORM_COUNT + 2)) * i;
      
      if (previousHadBoost) {
        y += minBoostGap;
      }
      
      const platform = new Platform(
        i,
        {
          x: Math.random() * (GAME_CONFIG.GAME_WIDTH - GAME_CONFIG.PLATFORM_WIDTH),
          y: y
        },
        Math.random() < 0.8 ? 'normal' : 'moving'
      );
      
      previousHadBoost = platform.boost !== null;
      newPlatforms.push(platform);
    }
    setPlatforms(newPlatforms);
  }, []);

  const calculatePlatformGap = useCallback((height: number) => {
    // Начальный разброс
    const minGap = 30;
    const maxGap = 70;
    
    // Увеличиваем разброс с высотой
    const heightFactor = Math.min(height / 100000, 1); // Максимальный эффект на высоте 10000
    const currentMinGap = minGap + (heightFactor * 20); // Минимальный разрыв увеличивается до 50
    const currentMaxGap = maxGap + (heightFactor * 50); // Максимальный разрыв увеличивается до 150
    
    // Проверяем, чтобы разрыв не превышал максимальную высоту прыжка
    const maxJumpHeight = (GAME_CONFIG.JUMP_FORCE * GAME_CONFIG.JUMP_FORCE) / (2 * GAME_CONFIG.GRAVITY);
    const safeMaxGap = Math.min(currentMaxGap, maxJumpHeight * 0.5); // Уменьшаем до 70% от максимальной высоты прыжка
    
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

  const generatePlatformsWithSafety = useCallback((startY: number, count: number) => {
    const platforms: Platform[] = [];
    let nextY = startY;
    let previousWasBreaking = false;
    let previousY = startY;

    const maxJumpHeight = (GAME_CONFIG.JUMP_FORCE * GAME_CONFIG.JUMP_FORCE) / (2 * GAME_CONFIG.GRAVITY);
    const minBoostGap = maxJumpHeight * 0.7;
    const minPlatformGap = 30;

    for (let i = 0; i < count; i++) {
      // Вычисляем базовый разрыв
      let gap = calculatePlatformGap(nextY);
      
      // Проверяем минимальный разрыв от предыдущей платформы
      if (nextY - previousY < minPlatformGap) {
        gap = Math.max(gap, minPlatformGap);
      }

      // Обновляем nextY с учетом разрыва
      nextY = previousY + gap;

      // Создаем платформу
      let platform: Platform;
      if (previousWasBreaking) {
        platform = new Platform(
          Date.now() + i,
          {
            x: Math.random() * (GAME_CONFIG.GAME_WIDTH - GAME_CONFIG.PLATFORM_WIDTH),
            y: nextY
          },
          'normal'
        );
        previousWasBreaking = false;
      } else {
        platform = generatePlatform(nextY);
        previousWasBreaking = platform.type === 'breaking';
      }
      
      // Если платформа имеет буст, увеличиваем разрыв для следующей
      if (platform.boost !== null) {
        nextY += Math.max(0, minBoostGap - gap);
      }
      
      platforms.push(platform);
      previousY = nextY;
    }

    return platforms;
  }, [calculatePlatformGap, generatePlatform]);

  // Добавляем функцию генерации врагов
  const generateEnemy = useCallback((yPosition: number) => {
    const type = Math.random() < 0.5 ? 'static' : 'moving';
    return new Enemy({
      x: Math.random() * (GAME_CONFIG.GAME_WIDTH - 30),
      y: yPosition
    }, type);
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
    enemies.forEach(enemy => enemy.draw(ctx));
    
    ctx.restore();
    
    // Рисуем счет поверх всего (без смещения)
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
  }, [player, platforms, score, gameOver, cameraOffset, enemies]);

  const resetGame = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setMaxHeight(0);
    setCameraOffset(0);
    player.reset();
    generateInitialPlatforms();
    gameOverScreen.current = null;
    setEnemies([]);
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
      }
    });

    // Обновляем максимальную высоту и очки реже
    if (player.position.y > maxHeight) {
      const newHeight = Math.floor(player.position.y);
      if (newHeight - maxHeight >= 1) {
        setMaxHeight(newHeight);
        setScore(prev => prev + (newHeight - Math.floor(maxHeight)));
        
        // Генерируем врагов после высоты 3000
        if (newHeight > 3000) {
            const lastCheckpoint = Math.floor(maxHeight / 500) * 500;
            const newCheckpoint = Math.floor(newHeight / 500) * 500;
            
            if (newCheckpoint > lastCheckpoint) {
              if (Math.random() < 0.2) { // Возвращаем шанс к 2%
                const newEnemy = generateEnemy(player.position.y + GAME_CONFIG.GAME_HEIGHT);
                setEnemies(prev => [...prev, newEnemy]);
              }
            }
        }
      }
    }

    // Обновляем и проверяем столкновения с врагами
    enemies.forEach(enemy => {
      enemy.update();
      const { collision, fromTop } = checkEnemyCollision(player, enemy);
      
      if (collision) {
        if (fromTop) {
          // Игрок прыгнул на врага
          player.jump(GAME_CONFIG.JUMP_FORCE * 1.1);
          setEnemies(prev => prev.filter(e => e !== enemy));
        } else {
          // Игрок столкнулся с врагом
          setGameOver(true);
          return;
        }
      }
    });

    // Удаляем врагов, которые ушли далеко вниз
    setEnemies(prev => prev.filter(enemy => 
      enemy.position.y > player.position.y - GAME_CONFIG.GAME_HEIGHT
    ));

    // Удаляем платформы, которые полностью разрушились
    setPlatforms(prev => prev.filter(platform => !platform.shouldBeRemoved()));

    // Генерируем новые платформы, если игрок поднялся достаточно высоко
    const highestPlatform = Math.max(...platforms.map(p => p.position.y));
    if (player.position.y + GAME_CONFIG.GAME_HEIGHT > highestPlatform) {
      const newPlatforms = [
        ...platforms,
        ...generatePlatformsWithSafety(highestPlatform, 3)
      ];
      setPlatforms(newPlatforms);
    }

    // Удаляем платформы, которые ушли далеко вниз
    setPlatforms(prev => prev.filter(platform => 
      platform.position.y > player.position.y - GAME_CONFIG.GAME_HEIGHT
    ));

    draw(ctx);
  }, [platforms, leftPressed, rightPressed, draw, generateInitialPlatforms, player, gameOver, cameraOffset, maxHeight, enemies]);

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