interface TelegramWebApps {
    WebApp: {
      headerColor: string;
      // Добавьте другие свойства WebApp, которые вы используете
    }
  }
  
  interface Window {
    Telegram: TelegramWebApps;
  }