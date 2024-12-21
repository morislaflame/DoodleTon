import { Position } from '../types';
import { GAME_CONFIG } from '../utils/constants';

export class Player {
  position: Position;
  velocity: Position;
  width: number;
  height: number;

  constructor() {
    this.position = {
      x: GAME_CONFIG.GAME_WIDTH / 2,
      y: 100
    };
    this.velocity = {
      x: 0,
      y: 0
    };
    this.width = 40;
    this.height = 40;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.arc(
      this.position.x + this.width / 2,
      GAME_CONFIG.GAME_HEIGHT - this.position.y,
      this.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  update(deltaTime: number, leftPressed: boolean, rightPressed: boolean) {
    // Обновление горизонтального движения
    if (leftPressed) {
      this.velocity.x = -GAME_CONFIG.MOVE_SPEED;
    } else if (rightPressed) {
      this.velocity.x = GAME_CONFIG.MOVE_SPEED;
    } else {
      this.velocity.x = 0;
    }

    // Применяем гравитацию
    this.velocity.y -= GAME_CONFIG.GRAVITY * (deltaTime / 16.67);

    // Обновляем позицию
    this.position.x += this.velocity.x * (deltaTime / 16.67);
    this.position.y += this.velocity.y * (deltaTime / 16.67);

    // Проверяем границы экрана по горизонтали
    if (this.position.x < 0) {
      this.position.x = GAME_CONFIG.GAME_WIDTH;
    } else if (this.position.x > GAME_CONFIG.GAME_WIDTH) {
      this.position.x = 0;
    }
  }

  jump(force: number) {
    this.velocity.y = force;
  }

  reset() {
    this.position = {
      x: GAME_CONFIG.GAME_WIDTH / 2,
      y: 100
    };
    this.velocity = {
      x: 0,
      y: 0
    };
  }
}