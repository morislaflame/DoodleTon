import { Position } from '../../types';
import { GAME_CONFIG } from '../../utils/constants';

export class Enemy {
  position: Position;
  width: number;
  height: number;
  private animationFrame: number;

  constructor(position: Position) {
    this.position = position;
    this.width = 30;
    this.height = 30;
    this.animationFrame = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const yOffset = Math.sin(this.animationFrame / 20) * 3;
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
      this.position.x + this.width / 2,
      GAME_CONFIG.GAME_HEIGHT - (this.position.y + yOffset),
      this.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  update() {
    this.animationFrame++;
  }
}