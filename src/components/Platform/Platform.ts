import { Position } from '../../types';
import { GAME_CONFIG } from '../../utils/constants';
import { Boost } from '../Boost/Boost';

export type PlatformType = 'normal' | 'moving' | 'breaking';

export class Platform {
  id: number;
  position: Position;
  width: number;
  height: number;
  type: PlatformType;
  speed?: number;
  private breakingAnimation: number;
  private isBreaking: boolean;
  boost: Boost | null;

  constructor(id: number, position: Position, type: PlatformType = 'normal') {
    this.id = id;
    this.position = position;
    this.width = GAME_CONFIG.PLATFORM_WIDTH;
    this.height = GAME_CONFIG.PLATFORM_HEIGHT;
    this.type = type;
    this.breakingAnimation = 0;
    this.isBreaking = false;
    this.boost = null;
    
    if (type === 'moving') {
      this.speed = 2;
    } else if (type === 'normal' && position.y > 500) {
      const random = Math.random();
      if (random < 0.03) {
        this.boost = new Boost({
          x: position.x + GAME_CONFIG.PLATFORM_WIDTH / 2 - 10,
          y: position.y + GAME_CONFIG.PLATFORM_HEIGHT + 0
        }, 'quadruple');
      } else if (random < 0.13) { // 0.03 + 0.10
        this.boost = new Boost({
          x: position.x + GAME_CONFIG.PLATFORM_WIDTH / 2 - 10,
          y: position.y + GAME_CONFIG.PLATFORM_HEIGHT + 0
        }, 'double');
      } else if (random < 0.18) { // 0.13 + 0.05
        this.boost = new Boost({
          x: position.x + GAME_CONFIG.PLATFORM_WIDTH / 2 - 10,
          y: position.y + GAME_CONFIG.PLATFORM_HEIGHT + 0
        }, 'rapidfire');
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.getColor();
    
    if (this.type === 'breaking' && this.isBreaking) {
      const breakingWidth = this.width * (1 - this.breakingAnimation / 10);
      const breakingX = this.position.x + (this.width - breakingWidth) / 2;
      
      ctx.fillRect(
        breakingX,
        GAME_CONFIG.GAME_HEIGHT - this.position.y,
        breakingWidth,
        this.height
      );
    } else {
      ctx.fillRect(
        this.position.x,
        GAME_CONFIG.GAME_HEIGHT - this.position.y,
        this.width,
        this.height
      );
    }

    if (this.boost && !this.boost.isCollected) {
      this.boost.update();
      this.boost.draw(ctx);
    }
  }

  update(deltaTime: number) {
    if (this.type === 'moving' && this.speed) {
      this.position.x += this.speed * (deltaTime / 16.67);

      if (this.position.x + this.width > GAME_CONFIG.GAME_WIDTH) {
        this.speed = -Math.abs(this.speed);
      } else if (this.position.x < 0) {
        this.speed = Math.abs(this.speed);
      }
    }

    if (this.type === 'breaking' && this.isBreaking) {
      this.breakingAnimation += deltaTime / 50;
    }
  }

  startBreaking() {
    if (this.type === 'breaking') {
      this.isBreaking = true;
    }
  }

  shouldBeRemoved(): boolean {
    return this.type === 'breaking' && this.breakingAnimation >= 10;
  }

  private getColor(): string {
    switch (this.type) {
      case 'moving':
        return '#7fb2e5';
      case 'breaking':
        return this.isBreaking ? '#ff6b6b' : '#e57f7f';
      default:
        return '#95c471';
    }
  }
}