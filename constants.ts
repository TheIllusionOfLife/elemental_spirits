import { ElementType, Language, Translation } from './types';

export const GRID_SIZE = 6;
export const GAME_DURATION = 60; // seconds
export const MIN_MATCH_LENGTH = 3;
export const BOMB_THRESHOLD = 6; // Connect 6+ to get a bomb
export const FEVER_DURATION = 10; // seconds

export const ELEMENT_CONFIG: Record<ElementType, { color: string; glow: string; nameEn: string; nameJa: string }> = {
  [ElementType.FIRE]: { 
    color: '#f59e0b', 
    glow: 'shadow-[0_0_20px_#ef4444]', 
    nameEn: 'Ignis',
    nameJa: 'イグニス'
  },
  [ElementType.WATER]: { 
    color: '#06b6d4', 
    glow: 'shadow-[0_0_20px_#3b82f6]', 
    nameEn: 'Aqua',
    nameJa: 'アクア'
  },
  [ElementType.NATURE]: { 
    color: '#4ade80', 
    glow: 'shadow-[0_0_20px_#22c55e]', 
    nameEn: 'Leafy',
    nameJa: 'リーフィ'
  },
  [ElementType.PRISM]: {
    color: '#d946ef', // Fuchsia/Magenta for Magic feel, distinct from White/Yellow
    glow: 'shadow-[0_0_30px_#d946ef]',
    nameEn: 'Star',
    nameJa: 'スター'
  }
};

export const TEXT: Record<Language, Translation> = {
  en: {
    title: "ELEMENTAL SPIRITS", // Updated Title
    start: "WAKE THEM UP!",
    score: "SCORE",
    time: "TIME",
    gameOver: "SLEEPY TIME",
    finalScore: "Final Score",
    replay: "WAKE UP AGAIN",
    combo: "COMBO!",
    bonus: "HAPPY!",
    tutorial: "Link 3+ matching spirits to make them happy!",
    level: "LV",
    fever: "PARTY TIME!"
  },
  ja: {
    title: "エレメンタル・スピリッツ",
    start: "精霊たちを起こす",
    score: "スコア",
    time: "残り時間",
    gameOver: "おやすみなさい",
    finalScore: "最終スコア",
    replay: "もう一度遊ぶ",
    combo: "コンボ！",
    bonus: "ハッピー！",
    tutorial: "同じ精霊を3つ以上つなげて喜ばせよう！",
    level: "LV",
    fever: "パーティータイム！"
  }
};