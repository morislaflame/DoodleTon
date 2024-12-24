import { Position } from '../../types';
import { GAME_CONFIG } from '../../utils/constants';

export class Player {
  private static sprite: HTMLImageElement;
  private static isImageLoaded: boolean = false;
  private frameWidth: number = 32;
  private frameHeight: number = 32;
  private framesInRow: number = 8;
  private framesInColumn: number = 1;

  position: Position;
  velocity: Position;
  width: number;
  height: number;
  isJumping: boolean;
  rapidFireActive: boolean;
  rapidFireEndTime: number | null;
  autoFireActive: boolean;
  autoFireEndTime: number | null;
  shieldActive: boolean;
  lives: number;

  private currentFrame: number = 0;
  // private frameRow: number = 0;
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
    this.shieldActive = false;
    this.lives = 3;

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
      Player.sprite.src = 'assets/Owlet_Monster_Jump_8.png';
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

    // Определяем кадр анимации  зависимости от состояния
    if (this.velocity.y > 0) {
      // Движение вверх
      this.currentFrame = 2; // Используем кадр для прыжка вверх
    } else if (this.velocity.y < 0) {
      // Падение
      this.currentFrame = 6; // Используем кадр для падения
    } else if (this.velocity.x !== 0) {
      // Движение в сторону
      this.updateAnimation(); // Анимация бега
    } else {
      // Стоим на месте
      this.currentFrame = 0; // Используем кадр для idle состояния
    }

    const drawX = this.position.x;
    const drawY = GAME_CONFIG.GAME_HEIGHT - this.position.y;

    const scaleFactor = 1.5;
    const scaledWidth = this.width * scaleFactor;
    const scaledHeight = this.height * scaleFactor;
    
    // Вычисляем смещение для центрирования
    const offsetX = (scaledWidth - this.width) / 2;
    const offsetY = (scaledHeight - this.height) / 2;
    const verticalAdjustment = 10; // Добавляем дополнительное смещение вверх

    // Отрисовка с учетом направления движения и центрирования
    if (this.velocity.x >= 0) {
      ctx.drawImage(
        Player.sprite,
        this.currentFrame * this.frameWidth,
        0,
        this.frameWidth,
        this.frameHeight,
        drawX - offsetX,
        drawY - offsetY - verticalAdjustment, // Добавляем смещение вверх
        scaledWidth,
        scaledHeight
      );
    } else {
      ctx.save();
      ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(
        Player.sprite,
        this.currentFrame * this.frameWidth,
        0,
        this.frameWidth,
        this.frameHeight,
        -scaledWidth / 2,
        -scaledHeight / 2 - verticalAdjustment, // Добавляем смещение вверх
        scaledWidth,
        scaledHeight
      );
      ctx.restore();
    }

    // Отладочный прямоугольник
    ctx.strokeStyle = 'red';
    ctx.strokeRect(drawX, drawY, this.width, this.height);

    // Добавляем отрисовку щита
    if (this.shieldActive) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        this.position.x + this.width / 2,
        GAME_CONFIG.GAME_HEIGHT - this.position.y + this.height / 2,
        this.width / 1.5,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }

  private updateAnimation() {
    const now = Date.now();
    if (now - this.lastFrameUpdate >= this.frameUpdateInterval) {
      // Анимация бега использует кадры с 3 по 5
      this.currentFrame = 3 + ((this.currentFrame - 2) % 3);
      this.lastFrameUpdate = now;
    }
  }

  update(_deltaTime: number, leftPressed: boolean, rightPressed: boolean) {
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
    this.shieldActive = false;
    this.lives = 3;
  }

  activateRapidFire() {
    this.rapidFireActive = true;
    this.rapidFireEndTime = Date.now() + 5000; // 5 секунд
  }

  activateAutoFire() {
    this.autoFireActive = true;
    this.autoFireEndTime = Date.now() + 7000; // 7 секунд
  }

  activateShield() {
    this.shieldActive = true;
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

  loseLife() {
    this.lives--;
    return this.lives <= 0;
  }
}