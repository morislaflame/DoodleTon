interface TelegramWebApps {
    WebApp: {
      headerColor: string;
      isOrientationLocked: boolean;
      // Добавьте другие свойства WebApp, которые вы используете
    }
  }
  
  interface Window {
    Telegram: TelegramWebApps;
  }