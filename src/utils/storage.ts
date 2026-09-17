import { ArtworkRecord, Achievement } from '../types';

const GALLERY_STORAGE_KEY = 'scribble_art_gallery';
const UNLOCKED_LEVEL_KEY = 'scribble_unlocked_level';
const ACHIEVEMENTS_KEY = 'scribble_achievements';
const ARTIST_NAME_KEY = 'scribble_artist_name';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_creation',
    title: 'First Creation',
    description: 'Breathed life into your very first scribble.',
    iconName: 'Sparkles',
  },
  {
    id: 'color_explorer',
    title: 'Color Explorer',
    description: 'Explored a rich palette with 5 or more colors.',
    iconName: 'Palette',
  },
  {
    id: 'rainbow_artist',
    title: 'Rainbow Artist',
    description: 'Used 8 or more vivid colors in a single drawing.',
    iconName: 'Sun',
  },
  {
    id: 'scribble_master',
    title: 'Scribble Master',
    description: 'Conquered Level 4: The Wild Scribble.',
    iconName: 'Brush',
  },
  {
    id: 'abstract_artist',
    title: 'Abstract Artist',
    description: 'Completed an Abstract level with flowing freedom.',
    iconName: 'Layers',
  },
  {
    id: 'creations_5',
    title: 'Budding Artist',
    description: 'Created 5 unique artworks in your personal gallery.',
    iconName: 'Award',
  },
  {
    id: 'creations_10',
    title: 'Gallery Master',
    description: 'Created 10 distinct works of art.',
    iconName: 'Trophy',
  },
  {
    id: 'infinite_creator',
    title: 'Infinite Creator',
    description: 'Embraced the boundless Infinite Mode.',
    iconName: 'Infinity',
  },
  {
    id: 'daily_devotee',
    title: 'Daily Devotee',
    description: 'Completed a Daily Challenge canvas.',
    iconName: 'Calendar',
  },
  {
    id: 'frame_connoisseur',
    title: 'Frame Connoisseur',
    description: 'Explored different gallery frames for your artwork.',
    iconName: 'Frame',
  },
];

export function getGalleryArtworks(): ArtworkRecord[] {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load gallery artworks:', e);
    return [];
  }
}

export function saveArtworkToGallery(artwork: ArtworkRecord): boolean {
  try {
    const list = getGalleryArtworks();
    // Prepend new artwork to front of list
    const updated = [artwork, ...list.filter((a) => a.id !== artwork.id)];
    // Cap at 60 items to keep storage safe
    const trimmed = updated.slice(0, 60);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch (e) {
    console.error('Failed to save artwork:', e);
    return false;
  }
}

export function updateGalleryArtwork(id: string, updates: Partial<ArtworkRecord>): boolean {
  try {
    const list = getGalleryArtworks();
    const updated = list.map((a) => (a.id === id ? { ...a, ...updates } : a));
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export function deleteGalleryArtwork(id: string): boolean {
  try {
    const list = getGalleryArtworks();
    const updated = list.filter((a) => a.id !== id);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export function getUnlockedLevel(): number {
  try {
    const val = localStorage.getItem(UNLOCKED_LEVEL_KEY);
    return val ? Math.max(1, parseInt(val, 10)) : 1;
  } catch {
    return 1;
  }
}

export function setUnlockedLevel(lvl: number) {
  try {
    const current = getUnlockedLevel();
    if (lvl > current) {
      localStorage.setItem(UNLOCKED_LEVEL_KEY, String(lvl));
    }
  } catch {
    // ignore
  }
}

export function getAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return INITIAL_ACHIEVEMENTS;
    const unlockedMap: Record<string, string> = JSON.parse(raw);
    return INITIAL_ACHIEVEMENTS.map((ach) => ({
      ...ach,
      unlockedAt: unlockedMap[ach.id],
    }));
  } catch {
    return INITIAL_ACHIEVEMENTS;
  }
}

export function unlockAchievement(id: string): Achievement | null {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    const unlockedMap: Record<string, string> = raw ? JSON.parse(raw) : {};
    if (unlockedMap[id]) return null; // already unlocked

    unlockedMap[id] = new Date().toISOString();
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedMap));

    const ach = INITIAL_ACHIEVEMENTS.find((a) => a.id === id);
    if (ach) {
      return { ...ach, unlockedAt: unlockedMap[id] };
    }
    return null;
  } catch {
    return null;
  }
}

export function getArtistName(): string {
  try {
    return localStorage.getItem(ARTIST_NAME_KEY) || 'You';
  } catch {
    return 'You';
  }
}

export function setArtistName(name: string) {
  try {
    localStorage.setItem(ARTIST_NAME_KEY, name.trim() || 'You');
  } catch {
    // ignore
  }
}
