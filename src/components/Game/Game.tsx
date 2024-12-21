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
  
  const leftPressed = useKeyPress('ArrowLeft');
  const rightPressed = useKeyPress('ArrowRight');

  // Генерация начальных платформ
  const generateInitialPlatforms = useCallback(() => {
    const newPlatforms: Platform[] = [];
    // Добавляем стартовую платформу ������од игроком
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
          y: (GAME_CONFIG.GAME_HEIGHT / GAME_CONFIG.PLATFORM_COUNT) * i
        },
        Math.random() < 0.8 ? 'normal' : 'moving'
      ));
    }
    setPlatforms(newPlatforms);
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
    
    // Рисуем игровые объекты
    player.draw(ctx);
    platforms.forEach(platform => platform.draw(ctx));
    
    // Рисуем счет
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
  }, [player, platforms, score, gameOver]);

  const resetGame = useCallback(() => {
    setGameOver(false);
    setScore(0);
    player.reset();
    generateInitialPlatforms();
    gameOverScreen.current = null;
  }, [generateInitialPlatforms, player]);

  const updateGame = useCallback((deltaTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Если игра окончена, только отрисовываем
    if (gameOver) {
      if (!gameOverScreen.current) {
        gameOverScreen.current = new GameOver(score);
      }
      draw(ctx);
      return;
    }

    // Обновляем игровую логику
    if (platforms.length === 0) {
      generateInitialPlatforms();
    }

    player.update(deltaTime, leftPressed, rightPressed);

    // Проверяем падение игрока
    if (player.position.y + player.height < 0) {
      setGameOver(true);
      return;
    }

    platforms.forEach(platform => {
      platform.update(deltaTime);
      if (checkPlatformCollision(player, platform)) {
        const { newVelocityY, shouldBreak } = handlePlatformCollision(player, platform);
        player.jump(newVelocityY);
        if (shouldBreak) {
          setPlatforms(prev => prev.filter(p => p.id !== platform.id));
        }
        setScore(prev => prev + 10);
      }
    });

    // Отрисовываем обновленное состояние
    draw(ctx);
  }, [platforms, leftPressed, rightPressed, gameOver, score, player, generateInitialPlatforms, draw]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameOver || !gameOverScreen.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (gameOverScreen.current.isRestartButtonClicked(x, y)) {
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