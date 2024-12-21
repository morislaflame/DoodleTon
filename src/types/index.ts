export interface Position {
    x: number;
    y: number;
  }
  
  export interface Platform {
    id: number;
    position: Position;
    width: number;
    height: number;
    type: 'normal' | 'moving' | 'breaking';
  }
  
  export interface Player {
    position: Position;
    velocity: Position;
    width: number;
    height: number;
  }