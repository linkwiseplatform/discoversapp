import type { LucideIcon } from 'lucide-react';

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  qrCode: string;
}

export type Character = 'male' | 'female';
