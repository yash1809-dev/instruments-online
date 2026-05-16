import type { ChordDefinition, StringNote } from '@/types';

// ─────────────────────────────────────────────────────────
//  Chord Library — standard acoustic guitar chord shapes
//  String order: [0]=low E, [1]=A, [2]=D, [3]=G, [4]=B, [5]=high E
// ─────────────────────────────────────────────────────────

export const CHORD_LIBRARY: Record<string, ChordDefinition> = {
  // ── Open Chords ────────────────────────────────────────
  'E': {
    name: 'E', displayName: 'E Major',
    positions: [
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 2, finger: 3 },
      { string: 4, fret: 1, finger: 1 },
    ],
    muted: [false, false, false, false, false, false],
    open:  [true,  false, false, true,  false, true ],
    difficulty: 2,
  },
  'Em': {
    name: 'Em', displayName: 'E Minor',
    positions: [
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 2, finger: 3 },
    ],
    muted: [false, false, false, false, false, false],
    open:  [true,  false, false, true,  true,  true ],
    difficulty: 1,
  },
  'A': {
    name: 'A', displayName: 'A Major',
    positions: [
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 2, finger: 3 },
      { string: 4, fret: 2, finger: 4 },
    ],
    muted: [true,  false, false, false, false, false],
    open:  [false, true,  false, false, false, true ],
    difficulty: 2,
  },
  'Am': {
    name: 'Am', displayName: 'A Minor',
    positions: [
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 2, finger: 3 },
      { string: 4, fret: 1, finger: 1 },
    ],
    muted: [true,  false, false, false, false, false],
    open:  [false, true,  false, false, false, true ],
    difficulty: 1,
  },
  'D': {
    name: 'D', displayName: 'D Major',
    positions: [
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 4 },
      { string: 5, fret: 2, finger: 1 },
    ],
    muted: [true,  true,  false, false, false, false],
    open:  [false, false, true,  false, false, false],
    difficulty: 2,
  },
  'Dm': {
    name: 'Dm', displayName: 'D Minor',
    positions: [
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 4 },
      { string: 5, fret: 1, finger: 1 },
    ],
    muted: [true,  true,  false, false, false, false],
    open:  [false, false, true,  false, false, false],
    difficulty: 2,
  },
  'G': {
    name: 'G', displayName: 'G Major',
    positions: [
      { string: 0, fret: 3, finger: 2 },
      { string: 1, fret: 2, finger: 1 },
      { string: 5, fret: 3, finger: 3 },
    ],
    muted: [false, false, false, false, false, false],
    open:  [false, false, true,  true,  false, false],
    difficulty: 2,
  },
  'C': {
    name: 'C', displayName: 'C Major',
    positions: [
      { string: 1, fret: 3, finger: 3 },
      { string: 2, fret: 2, finger: 2 },
      { string: 4, fret: 1, finger: 1 },
    ],
    muted: [true,  false, false, false, false, false],
    open:  [false, false, false, true,  false, true ],
    difficulty: 2,
  },
  'F': {
    name: 'F', displayName: 'F Major',
    positions: [
      { string: 0, fret: 1, finger: 1 },
      { string: 1, fret: 1, finger: 1 },
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 3, finger: 4 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 1, finger: 1 },
    ],
    muted: [false, false, false, false, false, false],
    open:  [false, false, false, false, false, false],
    barreStart: 1,
    difficulty: 4,
  },
  'B': {
    name: 'B', displayName: 'B Major',
    positions: [
      { string: 1, fret: 2, finger: 1 },
      { string: 2, fret: 4, finger: 3 },
      { string: 3, fret: 4, finger: 4 },
      { string: 4, fret: 4, finger: 4 },
      { string: 5, fret: 2, finger: 1 },
    ],
    muted: [true,  false, false, false, false, false],
    open:  [false, false, false, false, false, false],
    difficulty: 4,
  },
  'Bm': {
    name: 'Bm', displayName: 'B Minor',
    positions: [
      { string: 1, fret: 2, finger: 1 },
      { string: 2, fret: 3, finger: 2 },
      { string: 3, fret: 4, finger: 4 },
      { string: 4, fret: 4, finger: 3 },
      { string: 5, fret: 2, finger: 1 },
    ],
    muted: [true,  false, false, false, false, false],
    open:  [false, false, false, false, false, false],
    barreStart: 2,
    difficulty: 4,
  },
  'G7': {
    name: 'G7', displayName: 'G7',
    positions: [
      { string: 0, fret: 3, finger: 3 },
      { string: 1, fret: 2, finger: 2 },
      { string: 4, fret: 1, finger: 1 },
    ],
    muted: [false, false, false, false, false, false],
    open:  [false, false, true,  true,  false, true ],
    difficulty: 3,
  },
  'C7': {
    name: 'C7', displayName: 'C7',
    positions: [
      { string: 1, fret: 3, finger: 3 },
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 3, finger: 4 },
      { string: 4, fret: 1, finger: 1 },
    ],
    muted: [true,  false, false, false, false, false],
    open:  [false, false, false, false, false, true ],
    difficulty: 3,
  },
  'D7': {
    name: 'D7', displayName: 'D7',
    positions: [
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 1, finger: 1 },
      { string: 5, fret: 2, finger: 3 },
    ],
    muted: [true,  true,  false, false, false, false],
    open:  [false, false, true,  false, false, false],
    difficulty: 2,
  },
  'E7': {
    name: 'E7', displayName: 'E7',
    positions: [
      { string: 1, fret: 2, finger: 2 },
      { string: 4, fret: 1, finger: 1 },
    ],
    muted: [false, false, false, false, false, false],
    open:  [true,  false, false, true,  false, true ],
    difficulty: 2,
  },
  'A7': {
    name: 'A7', displayName: 'A7',
    positions: [
      { string: 2, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 3 },
    ],
    muted: [true,  false, false, false, false, false],
    open:  [false, true,  false, true,  false, true ],
    difficulty: 2,
  },
};

export const BEGINNER_CHORDS = ['Em', 'Am', 'E', 'A', 'D', 'G', 'C'];
export const INTERMEDIATE_CHORDS = ['F', 'Bm', 'B', 'G7', 'C7', 'D7'];
export const CHORD_PROGRESSIONS: Record<string, string[]> = {
  'I-V-vi-IV (Pop)': ['G', 'D', 'Em', 'C'],
  'I-IV-V (Blues)': ['A', 'D', 'E'],
  'ii-V-I (Jazz)': ['Dm', 'G', 'C'],
  'I-vi-IV-V (50s)': ['C', 'Am', 'F', 'G'],
  'vi-IV-I-V (Minor)': ['Am', 'F', 'C', 'G'],
  'I-V-vi-iii-IV': ['C', 'G', 'Am', 'Em', 'F'],
};

// Build audio notes for a chord (given active frets per string)
export function chordToAudioNotes(
  chord: ChordDefinition,
  velocity: number
): Array<{ string: number; fret: number; velocity: number }> {
  const notes: Array<{ string: number; fret: number; velocity: number }> = [];
  
  for (let s = 0; s < 6; s++) {
    if (chord.muted[s]) continue;
    
    const pos = chord.positions.find(p => p.string === s);
    const fret = pos ? pos.fret : (chord.open[s] ? 0 : -1);
    if (fret < 0) continue;
    
    // Slight velocity variation per string for realism
    const variation = 0.92 + Math.random() * 0.08;
    notes.push({ string: s, fret, velocity: Math.min(1, velocity * variation) });
  }
  
  return notes;
}

export function getChordByName(name: string): ChordDefinition | null {
  return CHORD_LIBRARY[name] ?? null;
}

export function getAllChordNames(): string[] {
  return Object.keys(CHORD_LIBRARY);
}
