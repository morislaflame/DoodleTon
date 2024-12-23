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
    
    switch(this.type) {
      case 'double':
        ctx.fillStyle = '#ffd700';
        break;
      case 'quadruple':
        ctx.fillStyle = '#ff4500';
        break;
      case 'rapidfire':
        ctx.fillStyle = '#00ff00';
        break;
    }
    
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
    switch(this.type) {
      case 'double':
        return 2;
      case 'quadruple':
        return 4;
      case 'rapidfire':
        return 1;
    }
  }
}