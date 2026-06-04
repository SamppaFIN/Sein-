import { v4 as uuidv4 } from 'uuid';
import type { Note, NoteStyle, SprayStroke } from '@/types';
import { PRESET_COLORS } from '@/types';

// Placeholder-värit eri tyyleille
const STYLE_COLORS: Record<NoteStyle, string> = {
  sticky: PRESET_COLORS[0].hex,
  graffiti: '#ff6b6b',
  chalk: '#1a1a2e',
  typewriter: '#f5f0e8',
  neon: '#0d0d0d',
};

/** Satunnainen väri paletista */
export function randomColor(): string {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)].hex;
}

/** Oletusteksti uudelle tarrale */
export const DEFAULT_NOTE_TEXT = 'Kirjoita uusi viesti seinälle';

/**
 * Luo uusi tarra annettuun koordinaattiin
 */
export function createStickyNote(
  x: number,
  y: number,
  z: number,
  content = DEFAULT_NOTE_TEXT,
  color?: string,
): Note {
  return {
    id: uuidv4(),
    x,
    y,
    z,
    content,
    tags: [],
    style: 'sticky',
    color: color || randomColor(),
    rotation: Math.random() * 6 - 3, // ±3°
    width: 220,
    height: 180,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Luo uusi graffiti-viesti
 */
export function createGraffitiNote(
  x: number,
  y: number,
  z: number,
  strokes: SprayStroke[],
  content = ''
): Note {
  return {
    id: uuidv4(),
    x,
    y,
    z,
    content,
    tags: [],
    style: 'graffiti',
    color: STYLE_COLORS.graffiti,
    rotation: 0,
    width: 300,
    height: 200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    drawing_data: { strokes },
  };
}

/**
 * Hakee oletusvärin tyylin perusteella
 */
export function getStyleColor(style: NoteStyle): string {
  return STYLE_COLORS[style];
}

/**
 * Laskee haalistumis-opasiteetin iän perusteella:
 * - alle 24h: 100%
 * - 1-7 päivää: 80%
 * - 7-30 päivää: 50%
 * - 30-90 päivää: 30%
 * - yli 90 päivää: 10%
 */
export function getFadeOpacity(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours < 24) return 1;
  if (ageHours < 24 * 7) return 0.8;
  if (ageHours < 24 * 30) return 0.5;
  if (ageHours < 24 * 90) return 0.3;
  return 0.1;
}
