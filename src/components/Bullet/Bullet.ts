import { Position } from '../../types';
import { GAME_CONFIG } from '../../utils/constants';

export class Bullet {
  position: Position;
  velocity: Position;
  width: number;
  height: number;

  constructor(position: Position) {
    this.position = { ...position };
    this.velocity = { x: 0, y: 15 }; // Пуля летит вверх
    this.width = 10;
    this.height = 10;
  }

  update() {
    this.position.y += this.velocity.y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(
      this.position.x,
      GAME_CONFIG.GAME_HEIGHT - this.position.y,
      this.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}