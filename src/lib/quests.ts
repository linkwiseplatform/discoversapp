
import { Map, Compass, Camera, Trees, BookOpen } from 'lucide-react';
import type { Quest } from './types';

export const quests: Quest[] = [
  {
    id: '1',
    title: 'Find the Ancient Map',
    description: 'The first piece of the puzzle is hidden. Scan the code on the old oak tree.',
    icon: Map,
    qrCode: 'OAKTREEQUEST',
  },
  {
    id: '2',
    title: 'Follow the Compass',
    description: 'Your compass points to a secret. Find the next clue near the sundial.',
    icon: Compass,
    qrCode: 'SUNDIALSECRET',
  },
  {
    id: '3',
    title: 'Capture the Scenery',
    description: 'A beautiful view holds a key. Scan the plaque at the scenic overlook.',
    icon: Camera,
    qrCode: 'SCENICVIEWKEY',
  },
  {
    id: '4',
    title: 'Whispers of the Forest',
    description: 'Listen to the trees. The next step is hidden among the tallest pines.',
    icon: Trees,
    qrCode: 'TALLESTPINE',
  },
  {
    id: '5',
    title: 'Read the Final Chapter',
    description: 'The story concludes here. Find the final QR code on the last page of the storybook.',
    icon: BookOpen,
    qrCode: 'FINALCHAPTER',
  },
];
