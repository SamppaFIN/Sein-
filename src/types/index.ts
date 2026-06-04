export type NoteStyle = 'sticky' | 'graffiti' | 'chalk' | 'typewriter' | 'neon';

/** Esiasetetut värit uusille tarroille */
export const PRESET_COLORS = [
  { hex: '#fff9a8', label: 'Keltainen' },
  { hex: '#ffd1dc', label: 'Vaaleanpunainen' },
  { hex: '#d4f7c5', label: 'Vihreä' },
  { hex: '#c5e0f7', label: 'Sininen' },
  { hex: '#e8d1f7', label: 'Lila' },
  { hex: '#fafafa', label: 'Valkoinen' },
  { hex: '#ffcc80', label: 'Oranssi' },
  { hex: '#b2dfdb', label: 'Turkoosi' },
];

export const DEFAULT_COLOR = '#fff9a8';

/** Muokkausaika minuutteina — tämän jälkeen tarra lukittuu */
export const EDIT_WINDOW_MINUTES = 5;

export interface SprayStroke {
  points: number[];  // flat array: [x1, y1, x2, y2, ...]
  color: string;
  width: number;
  style: 'spray' | 'solid' | 'chalk';
}

export interface Note {
  id: string;
  x: number;
  y: number;
  z: number;
  content: string;
  tags: string[];
  style: NoteStyle;
  color: string;
  rotation: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
  drawing_data?: {
    strokes: SprayStroke[];
  };
}

export type ViewMode = 'sticky' | 'graffiti';

export interface WallDimensions {
  width: number;
  height: number;
}
