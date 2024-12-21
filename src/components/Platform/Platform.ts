import { Position } from '../../types';
import { GAME_CONFIG } from '../../utils/constants';

export type PlatformType = 'normal' | 'moving' | 'breaking';

export class Platform {
  id: number;
  position: Position;
  width: number;
  height: number;
  type: PlatformType;
  speed?: number; // Для движущихся платформ

  constructor(id: number, position: Position, type: PlatformType = 'normal') {
    this.id = id;
    this.position = position;
    this.width = GAME_CONFIG.PLATFORM_WIDTH;
    this.height = GAME_CONFIG.PLATFORM_HEIGHT;
    this.type = type;
    
    if (type === 'moving') {
      this.speed = 2;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.getColor();
    ctx.fillRect(
      this.position.x,
      GAME_CONFIG.GAME_HEIGHT - this.position.y,
      this.width,
      this.height
    );
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
  }

  private getColor(): string {
    switch (this.type) {
      case 'moving':
        return '#7fb2e5';
      case 'breaking':
        return '#e57f7f';
      default:
        return '#95c471';
    }
  }
}