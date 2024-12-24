import { GAME_CONFIG } from '../../utils/constants';

export class GameOver {
  private score: number;
  private lives: number;

  constructor(score: number, lives: number) {
    this.score = score;
    this.lives = lives;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Сохраняем текущий контекст
    ctx.save();
    
    // Очищаем весь canvas
    ctx.clearRect(0, 0, GAME_CONFIG.GAME_WIDTH, GAME_CONFIG.GAME_HEIGHT);
    
    // Затемняем экран
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, GAME_CONFIG.GAME_WIDTH, GAME_CONFIG.GAME_HEIGHT);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Рисуем текст Game Over
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('Game Over', GAME_CONFIG.GAME_WIDTH / 2, GAME_CONFIG.GAME_HEIGHT / 2 - 50);
    
    // Рисуем финальный счет
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${this.score}`, GAME_CONFIG.GAME_WIDTH / 2, GAME_CONFIG.GAME_HEIGHT / 2);
    
    // Рисуем кнопку Restart
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(
      GAME_CONFIG.GAME_WIDTH / 2 - 60,
      GAME_CONFIG.GAME_HEIGHT / 2 + 30,
      120,
      40
    );
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Restart', GAME_CONFIG.GAME_WIDTH / 2, GAME_CONFIG.GAME_HEIGHT / 2 + 55);
    
    // Добавляем причину проигрыша
    ctx.font = '20px Arial';
    const reason = this.lives <= 0 ? 'Все жизни потрачены!' : 'Падение вниз!';
    ctx.fillText(reason, GAME_CONFIG.GAME_WIDTH / 2, GAME_CONFIG.GAME_HEIGHT / 2 + 20);
    
    // Восстанавливаем контекст
    ctx.restore();
  }

  // Проверка клика по кнопке Restart
  isRestartButtonClicked(x: number, y: number): boolean {
    return (
      x >= GAME_CONFIG.GAME_WIDTH / 2 - 60 &&
      x <= GAME_CONFIG.GAME_WIDTH / 2 + 60 &&
      y >= GAME_CONFIG.GAME_HEIGHT / 2 + 30 &&
      y <= GAME_CONFIG.GAME_HEIGHT / 2 + 70
    );
  }
}