export const GAME_CONFIG = {
    GRAVITY: 0.4,         // Уменьшили гравитацию
    JUMP_FORCE: 12,       // Оставили прежним
    MOVE_SPEED: 5,
    PLATFORM_COUNT: 20,
    GAME_WIDTH: 380,
    GAME_HEIGHT: 600,
    PLATFORM_WIDTH: 60,
    PLATFORM_HEIGHT: 15,
    PLATFORM_CHANCES: {
        INITIAL: {
            NORMAL: 0.7,    // 70% в начале игры
            MOVING: 0.15,   // 15% в начале игры
            BREAKING: 0.15  // 15% в начале игры
        },
        MAX_HEIGHT_FACTOR: {
            NORMAL: 0.4,    // 40% на максимальной высоте
            MOVING: 0.3,    // 30% на максимальной высоте
            BREAKING: 0.3   // 30% на максимальной высоте
        }
    }
  };