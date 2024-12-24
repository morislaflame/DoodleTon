interface TelegramWebApps {
    WebApp: {
      headerColor: string;
      isOrientationLocked: boolean;
      Gyroscope: {
        isStarted: boolean;
        x: number;
        y: number;
        z: number;
        start: (params: { refresh_rate?: number }) => void;
        stop: () => void;
      }
    }
  }
  
  interface Window {
    Telegram: TelegramWebApps;
  }