import { Position } from '../../types';
import { GAME_CONFIG } from '../../utils/constants';

type EnemyType = 'static' | 'moving';

export class Enemy {
  position: Position;
  width: number;
  height: number;
  private animationFrame: number;
  type: EnemyType;
  private direction: number;
  private speed: number;

  constructor(position: Position, type: EnemyType = 'static') {
    this.position = position;
    this.width = 30;
    this.height = 30;
    this.animationFrame = 0;
    this.type = type;
    this.direction = 1;
    this.speed = 2;
}

draw(ctx: CanvasRenderingContext2D) {
    const yOffset = Math.sin(this.animationFrame / 20) * 3;
    
    ctx.fillStyle = this.type === 'static' ? '#ff0000' : '#ff6600';
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

    if (this.type === 'moving') {
      this.position.x += this.speed * this.direction;
      
      if (this.position.x <= 0 || this.position.x + this.width >= GAME_CONFIG.GAME_WIDTH) {
        this.direction *= -1;
      }
    }
  }
}