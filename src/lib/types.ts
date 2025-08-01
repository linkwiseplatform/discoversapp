import type { LucideIcon } from 'lucide-react';

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  qrCode: string;
}

export type Character = 'male' | 'female';

export interface Admin {
  id: string;
  name: string;
}

export interface GameConfig {
  numberOfStages: number;
  quests: {
    description: string;
    qrCode: string;
  }[];
  couponTitle: string;
  couponSubtitle: string;
  adminCode: string;
  gameStartCode: string;
}

export interface UserProgress {
  uid: string;
  name: string;
  lastPlayed: number;
  unlockedStages: number;
}
