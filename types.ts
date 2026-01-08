export enum ElementType {
  FIRE = 'FIRE',
  WATER = 'WATER',
  NATURE = 'NATURE',
  PRISM = 'PRISM' // Special bomb type
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export interface GridPosition {
  row: number;
  col: number;
}

export interface Orb {
  id: string;
  type: ElementType;
  position: GridPosition;
  isMatched: boolean;
  isHint: boolean;
  isBomb: boolean; // New property
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  scale: number;
}

export type Language = 'en' | 'ja';

export interface Translation {
  title: string;
  start: string;
  score: string;
  time: string;
  gameOver: string;
  finalScore: string;
  replay: string;
  combo: string;
  bonus: string;
  tutorial: string;
  level: string;
  fever: string;
}