import { Player } from '../components/Player/Player';
import { Platform } from '../components/Platform/Platform';
import { Boost } from '../components/Boost/Boost';
import { Enemy } from '../components/Enemy/Enemy';
import { Bullet } from '../components/Bullet/Bullet';
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
    const platformTop = platform.position.y + platform.height * 2;
  
    return (
      playerRight > platformLeft &&
      playerLeft < platformRight &&
      Math.abs(playerBottom - platformTop) < 10 &&
      player.velocity.y < 0
    );
  };

// Обработка столкновения с платформой разного типа
export const handlePlatformCollision = (
  player: Player,
  platform: Platform
): { newVelocityY: number; shouldBreak: boolean } => {
  let newVelocityY = GAME_CONFIG.JUMP_FORCE;
  
  if (platform.boost && !platform.boost.isCollected) {
    if (platform.boost.type === 'double' || platform.boost.type === 'quadruple') {
      const isBoostCollision = checkBoostCollision(player, platform.boost);
      if (isBoostCollision) {
        platform.boost.collect();
        newVelocityY *= platform.boost.getBoostMultiplier();
      }
    } else if (platform.boost.type === 'rapidfire' || 
               platform.boost.type === 'autofire' || 
               platform.boost.type === 'shield') {
      const isBoostCollision = checkBoostCollision(player, platform.boost) || 
                              checkShootingBoostCollision(player, platform.boost);
      if (isBoostCollision) {
        platform.boost.collect();
        if (platform.boost.type === 'rapidfire') {
          player.activateRapidFire();
        } else if (platform.boost.type === 'autofire') {
          player.activateAutoFire();
        } else if (platform.boost.type === 'shield') {
          player.activateShield();
        }
      }
    }
  }

  switch (platform.type) {
    case 'breaking':
      return { newVelocityY: newVelocityY * 0.7, shouldBreak: true };
    case 'moving':
      return { newVelocityY: newVelocityY * 1.2, shouldBreak: false };
    default:
      return { newVelocityY, shouldBreak: false };
  }
};

// Проверка выхода за границы экрана
export const checkBoundaryCollision = (position: number, boundary: number): number => {
  if (position < 0) return boundary;
  if (position > boundary) return 0;
  return position;
};

export const checkBoostCollision = (player: Player, boost: Boost): boolean => {
  if (boost.isCollected) return false;

  const playerLeft = player.position.x;
  const playerRight = player.position.x + player.width;
  const boostLeft = boost.position.x;
  const boostRight = boost.position.x + boost.width;

  const playerBottom = player.position.y;
  const boostTop = boost.position.y + boost.height;

  // Используем ту же логику, что и для платформ
  const horizontalOverlap = playerRight > boostLeft && playerLeft < boostRight;
  const verticalOverlap = Math.abs(playerBottom - boostTop) < 15; // Немного увеличиваем зону определения для бустов

  return horizontalOverlap && verticalOverlap;
};

export const checkEnemyCollision = (player: Player, enemy: Enemy): { collision: boolean, fromTop: boolean } => {
  const playerLeft = player.position.x;
  const playerRight = player.position.x + player.width;
  const enemyLeft = enemy.position.x;
  const enemyRight = enemy.position.x + enemy.width;

  const playerBottom = player.position.y;
  const playerTop = player.position.y + player.height;
  const enemyBottom = enemy.position.y;
  const enemyTop = enemy.position.y + enemy.height;

  const collision = playerRight > enemyLeft &&
  playerLeft < enemyRight &&
  playerTop > enemyBottom &&
  playerBottom < enemyTop;

// Проверяем, падает ли игрок сверху на врага
const fromTop = collision && 
  player.velocity.y < 0 && 
  Math.abs(playerBottom - enemyTop) < 10;

return { collision, fromTop };
};

export const checkBulletEnemyCollision = (bullet: Bullet, enemy: Enemy): boolean => {
    const bulletLeft = bullet.position.x - bullet.width / 2;
    const bulletRight = bullet.position.x + bullet.width / 2;
    const enemyLeft = enemy.position.x;
    const enemyRight = enemy.position.x + enemy.width;
  
    const bulletBottom = bullet.position.y - bullet.height / 2;
    const bulletTop = bullet.position.y + bullet.height / 2;
    const enemyBottom = enemy.position.y;
    const enemyTop = enemy.position.y + enemy.height;
  
    return (
      bulletRight > enemyLeft &&
      bulletLeft < enemyRight &&
      bulletTop > enemyBottom &&
      bulletBottom < enemyTop
    );
  };
export const checkShootingBoostCollision = (player: Player, boost: Boost): boolean => {
  if (boost.isCollected) return false;
  if (boost.type !== 'rapidfire' && boost.type !== 'autofire' && boost.type !== 'shield') return false;

  const playerLeft = player.position.x;
  const playerRight = player.position.x + player.width;
  const playerTop = GAME_CONFIG.GAME_HEIGHT - player.position.y;
  const playerBottom = GAME_CONFIG.GAME_HEIGHT - (player.position.y + player.height);

  const boostLeft = boost.position.x;
  const boostRight = boost.position.x + boost.width;
  const boostTop = GAME_CONFIG.GAME_HEIGHT - boost.position.y;
  const boostBottom = GAME_CONFIG.GAME_HEIGHT - (boost.position.y + boost.height);

  return (
    playerRight > boostLeft &&
    playerLeft < boostRight &&
    playerTop > boostBottom &&
    playerBottom < boostTop
  );
};
