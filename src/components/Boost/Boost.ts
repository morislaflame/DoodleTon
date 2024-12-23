import { Position } from '../../types';
import { GAME_CONFIG } from '../../utils/constants';
import { BoostType } from '../../types';

export class Boost {
  position: Position;
  width: number;
  height: number;
  isCollected: boolean;
  type: BoostType;
  private animationFrame: number;

  constructor(position: Position, type: BoostType) {
    this.position = position;
    this.width = 20;
    this.height = 20;
    this.isCollected = false;
    this.animationFrame = 0;
    this.type = type;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isCollected) return;

    const yOffset = Math.sin(this.animationFrame / 10) * 5;
    
    ctx.fillStyle = this.type === 'double' ? '#ffd700' : '#ff4500';
    ctx.beginPath();
    ctx.moveTo(
      this.position.x + this.width / 2,
      GAME_CONFIG.GAME_HEIGHT - (this.position.y + yOffset)
    );
    ctx.lineTo(
      this.position.x + this.width,
      GAME_CONFIG.GAME_HEIGHT - (this.position.y + this.height / 2 + yOffset)
    );
    ctx.lineTo(
      this.position.x + this.width / 2,
      GAME_CONFIG.GAME_HEIGHT - (this.position.y + this.height + yOffset)
    );
    ctx.lineTo(
      this.position.x,
      GAME_CONFIG.GAME_HEIGHT - (this.position.y + this.height / 2 + yOffset)
    );
    ctx.closePath();
    ctx.fill();
  }

  update() {
    this.animationFrame++;
  }

  collect() {
    this.isCollected = true;
  }

  getBoostMultiplier(): number {
    return this.type === 'double' ? 2 : 4;
  }
}