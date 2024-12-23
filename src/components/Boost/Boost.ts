import { Position } from '../../types';
import { GAME_CONFIG } from '../../utils/constants';

export class Boost {
  position: Position;
  width: number;
  height: number;
  isCollected: boolean;
  private animationFrame: number;

  constructor(position: Position) {
    this.position = position;
    this.width = 20;
    this.height = 20;
    this.isCollected = false;
    this.animationFrame = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isCollected) return;

    // Анимация парения
    const yOffset = Math.sin(this.animationFrame / 10) * 5;
    
    ctx.fillStyle = '#ffd700';
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
}