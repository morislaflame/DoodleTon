import { Position } from '../../types';
import { GAME_CONFIG } from '../../utils/constants';

export class Player {
  private static sprite: HTMLImageElement;
  private static isImageLoaded: boolean = false;
  
  position: Position;
  velocity: Position;
  width: number;
  height: number;
  isJumping: boolean;
  rapidFireActive: boolean;
  rapidFireEndTime: number | null;
  autoFireActive: boolean;
  autoFireEndTime: number | null;
  private frameWidth: number = 32;
  private frameHeight: number = 32;
  private currentFrame: number = 0;
  private frameRow: number = 0;

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

    // Загружаем спрайт только один раз
    if (!Player.sprite) {
      Player.sprite = new Image();
      Player.sprite.onload = () => {
        Player.isImageLoaded = true;
        console.log('Sprite loaded successfully');
      };
      Player.sprite.onerror = (e) => {
        console.error('Error loading sprite:', e);
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
      this.frameRow = 3; // Прыжок вверх
    } else if (this.velocity.y < 0) {
      this.frameRow = 4; // Падение
    } else if (this.velocity.x !== 0) {
      this.frameRow = 2; // Движение
    } else {
      this.frameRow = 0; // Покой
    }

    const drawX = this.position.x;
    const drawY = GAME_CONFIG.GAME_HEIGHT - this.position.y;

    // Рисуем спрайт
    if (this.velocity.x >= 0) {
      ctx.drawImage(
        Player.sprite,
        this.currentFrame * this.frameWidth,
        this.frameRow * this.frameHeight,
        this.frameWidth,
        this.frameHeight,
        drawX,
        drawY - this.height,
        this.width,
        this.height
      );
    } else {
      ctx.save();
      ctx.translate(drawX + this.width, drawY - this.height);
      ctx.scale(-1, 1);
      ctx.drawImage(
        Player.sprite,
        this.currentFrame * this.frameWidth,
        this.frameRow * this.frameHeight,
        this.frameWidth,
        this.frameHeight,
        0,
        0,
        this.width,
        this.height
      );
      ctx.restore();
    }

    // Отладочная информация
    if (this.position.y < GAME_CONFIG.GAME_HEIGHT + 100) {
      console.log('Player position:', {
        drawX,
        drawY,
        y: this.position.y,
        height: this.height,
        frameRow: this.frameRow,
        currentFrame: this.currentFrame
      });
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

    // Обновляем анимацию каждые 100мс
    if (Date.now() % 100 < 16) {
      this.currentFrame = (this.currentFrame + 1) % 8;
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