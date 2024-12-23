import { Position } from '../../types';
import { GAME_CONFIG } from '../../utils/constants';

export class Player {
  private static sprite: HTMLImageElement;
  private static isImageLoaded: boolean = false;
  private frameWidth: number = 100;
  private frameHeight: number = 100;
  private framesInRow: number = 9;
  private framesInColumn: number = 7;

  position: Position;
  velocity: Position;
  width: number;
  height: number;
  isJumping: boolean;
  rapidFireActive: boolean;
  rapidFireEndTime: number | null;
  autoFireActive: boolean;
  autoFireEndTime: number | null;
  private currentFrame: number = 0;
  private frameRow: number = 0;
  private lastFrameUpdate: number = 0;
  private frameUpdateInterval: number = 100; // Интервал обновления кадра в мс

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
    this.isJumping = false;
    this.rapidFireActive = false;
    this.rapidFireEndTime = null;
    this.autoFireActive = false;
    this.autoFireEndTime = null;

    if (!Player.sprite) {
      console.log('Starting sprite load...', {
        frameWidth: this.frameWidth,
        frameHeight: this.frameHeight,
        framesInRow: this.framesInRow,
        framesInColumn: this.framesInColumn
      });
      Player.sprite = new Image();
      Player.sprite.onload = () => {
        Player.isImageLoaded = true;
        console.log('Sprite loaded successfully:', {
          width: Player.sprite.width,
          height: Player.sprite.height,
          frameWidth: this.frameWidth,
          frameHeight: this.frameHeight,
          framesInRow: this.framesInRow,
          framesInColumn: this.framesInColumn
        });
      };
      Player.sprite.onerror = (e) => {
        console.error('Sprite load error:', e);
      };
      Player.sprite.src = 'assets/Soldier.png';
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!Player.isImageLoaded) {
      // Рисуем заглушку
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
      return;
    }

    // Определяем кадр анимации
    if (this.velocity.y > 0) {
      this.frameRow = 3;
    } else if (this.velocity.y < 0) {
      this.frameRow = 4;
    } else if (this.velocity.x !== 0) {
      this.frameRow = 2;
      this.updateAnimation();
    } else {
      this.frameRow = 0;
      this.currentFrame = 0;
    }

    const drawX = this.position.x;
    const drawY = GAME_CONFIG.GAME_HEIGHT - this.position.y - this.height;

    // Увеличиваем размер спрайта
    const scaleFactor = 6; // Увеличиваем в 1.8 раза
    const scaledWidth = this.width * scaleFactor;
    const scaledHeight = this.height * scaleFactor;
    const offsetX = (scaledWidth - this.width) / 2;
    const offsetY = (scaledHeight - this.height) / 2;

    // Центрируем спрайт в прямоугольнике
    if (this.velocity.x >= 0) {
      ctx.drawImage(
        Player.sprite,
        this.currentFrame * this.frameWidth,
        this.frameRow * this.frameHeight,
        this.frameWidth,
        this.frameHeight,
        drawX - offsetX,
        drawY - offsetY,
        scaledWidth,
        scaledHeight
      );
    } else {
      ctx.save();
      ctx.translate(drawX, drawY - offsetY);
      ctx.scale(-1, 1);
      ctx.drawImage(
        Player.sprite,
        this.currentFrame * this.frameWidth,
        this.frameRow * this.frameHeight,
        this.frameWidth,
        this.frameHeight,
        -scaledWidth + offsetX,
        0,
        scaledWidth,
        scaledHeight
      );
      ctx.restore();
    }

    // Отладочный прямоугольник
    ctx.strokeStyle = 'red';
    ctx.strokeRect(drawX, drawY, this.width, this.height);
  }

  private updateAnimation() {
    const now = Date.now();
    if (now - this.lastFrameUpdate >= this.frameUpdateInterval) {
      this.currentFrame = (this.currentFrame + 1) % this.framesInRow;
      this.lastFrameUpdate = now;
    }
  }

  update(deltaTime: number, leftPressed: boolean, rightPressed: boolean) {
    if (leftPressed) {
      this.velocity.x = -GAME_CONFIG.MOVE_SPEED;
    } else if (rightPressed) {
      this.velocity.x = GAME_CONFIG.MOVE_SPEED;
    } else {
      this.velocity.x = 0;
    }

    this.velocity.y -= GAME_CONFIG.GRAVITY;

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Проверяем границы экрана по горизонтали
    if (this.position.x < 0) {
      this.position.x = GAME_CONFIG.GAME_WIDTH;
    } else if (this.position.x > GAME_CONFIG.GAME_WIDTH) {
      this.position.x = 0;
    }
  }

  jump(force: number) {
    if (!this.isJumping) {
      this.velocity.y = force;
      this.isJumping = true;
    }
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
    this.isJumping = false;
    this.rapidFireActive = false;
    this.rapidFireEndTime = null;
    this.autoFireActive = false;
    this.autoFireEndTime = null;
  }

  activateRapidFire() {
    this.rapidFireActive = true;
    this.rapidFireEndTime = Date.now() + 5000; // 5 секунд
  }

  activateAutoFire() {
    this.autoFireActive = true;
    this.autoFireEndTime = Date.now() + 7000; // 7 секунд
  }

  updateBoosts() {
    if (this.rapidFireEndTime && Date.now() > this.rapidFireEndTime) {
      this.rapidFireActive = false;
      this.rapidFireEndTime = null;
    }
    if (this.autoFireEndTime && Date.now() > this.autoFireEndTime) {
      this.autoFireActive = false;
      this.autoFireEndTime = null;
    }
  }
}