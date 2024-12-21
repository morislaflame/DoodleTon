import { Player } from '../components/Player/Player';
import { Platform } from '../components/Platform/Platform';
import { GAME_CONFIG } from './constants';

// Проверка столкновения игрока с платформой
export const checkPlatformCollision = (player: Player, platform: Platform): boolean => {
  // Проверяем столкновение только если игрок падает
  if (player.velocity.y >= 0) return false;

  const playerLeft = player.position.x;
  const playerRight = player.position.x + player.width;
  const platformLeft = platform.position.x;
  const platformRight = platform.position.x + platform.width;

  const playerBottom = player.position.y;
  const platformTop = platform.position.y + platform.height;

  return (
    playerRight > platformLeft &&
    playerLeft < platformRight &&
    Math.abs(playerBottom - platformTop) < 10 &&
    player.velocity.y < 0
  );
};

// Обработка столкновения с платформой разного типа
export const handlePlatformCollision = (
  _player: Player,
  platform: Platform
): { newVelocityY: number; shouldBreak: boolean } => {
  switch (platform.type) {
    case 'breaking':
      return { newVelocityY: GAME_CONFIG.JUMP_FORCE * 0.7, shouldBreak: true };
    case 'moving':
      return { newVelocityY: GAME_CONFIG.JUMP_FORCE * 1.2, shouldBreak: false };
    default:
      return { newVelocityY: GAME_CONFIG.JUMP_FORCE, shouldBreak: false };
  }
};

// Проверка выхода за границы экрана
export const checkBoundaryCollision = (position: number, boundary: number): number => {
  if (position < 0) return boundary;
  if (position > boundary) return 0;
  return position;
};