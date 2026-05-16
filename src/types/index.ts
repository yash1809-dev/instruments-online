// ─────────────────────────────────────────────────────────
//  Core Types for Guitar Learning Platform
// ─────────────────────────────────────────────────────────

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type Handedness = 'right' | 'left';
export type MusicGenre = 'pop' | 'rock' | 'folk' | 'classical' | 'blues' | 'country';
export type PracticeGoal = 'songs' | 'chords' | 'technique' | 'rhythm' | 'theory';

// ── String & Fret ──────────────────────────────────────────
export type StringNumber = 0 | 1 | 2 | 3 | 4 | 5; // 0 = thickest (low E)
export type FretNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface StringNote {
  string: StringNumber;
  fret: FretNumber;
  finger?: 1 | 2 | 3 | 4; // index, middle, ring, pinky
}

// ── Chord System ───────────────────────────────────────────
export interface ChordDefinition {
  name: string;
  displayName: string;
  positions: StringNote[];   // fret positions per string
  muted: boolean[];          // which strings are muted (6 values)
  open: boolean[];           // which strings are open (6 values)
  barreStart?: number;       // barre chord starting fret
  barreEnd?: StringNumber;   // barre chord ending string index
  difficulty: 1 | 2 | 3 | 4 | 5;
}

// ── Touch / Gesture ────────────────────────────────────────
export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  force: number;          // 0–1 (touch pressure)
  timestamp: number;
}

export interface SwipeGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  velocityX: number;
  velocityY: number;
  velocity: number;       // magnitude
  direction: 'up' | 'down' | 'left' | 'right';
  duration: number;
  force: number;
}

export type GestureType =
  | 'pluck'
  | 'strum-down'
  | 'strum-up'
  | 'mute'
  | 'hold'
  | 'slide'
  | 'bend';

export interface GestureEvent {
  type: GestureType;
  stringIndex?: StringNumber;
  velocity: number;       // 0–1 attack/intensity
  timestamp: number;
  swipe?: SwipeGesture;
}

// ── Audio ──────────────────────────────────────────────────
export interface AudioNote {
  string: StringNumber;
  fret: FretNumber;
  velocity: number;       // 0–1
  duration?: number;      // ms, undefined = natural decay
}

export interface AudioEngineState {
  initialized: boolean;
  latency: number;        // ms
  sampleRate: number;
  bufferSize: number;
}

// ── String State ───────────────────────────────────────────
export interface GuitarStringState {
  index: StringNumber;
  isVibrating: boolean;
  vibrationAmplitude: number;   // 0–1
  vibrationFreq: number;        // Hz
  decayProgress: number;        // 0–1 (1 = silent)
  isMuted: boolean;
  activeFret: FretNumber;
  lastPlucked: number;          // timestamp
}

// ── Lesson System ──────────────────────────────────────────
export type LessonType = 'chord' | 'strumming' | 'song' | 'technique' | 'rhythm';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  difficulty: SkillLevel;
  durationMinutes: number;
  chords?: ChordDefinition[];
  strumPattern?: StrumPattern;
  bpm?: number;
  completed: boolean;
  progress: number;       // 0–100
}

export interface StrumPattern {
  name: string;
  beats: StrumBeat[];
  bpm: number;
  timeSignature: [number, number]; // e.g. [4,4]
}

export interface StrumBeat {
  beat: number;           // beat number (1-based)
  subdivision: number;    // 1 = quarter, 0.5 = eighth, 0.25 = sixteenth
  direction: 'down' | 'up' | 'miss';
  emphasis: boolean;
}

// ── Song System ────────────────────────────────────────────
export interface Song {
  id: string;
  title: string;
  artist: string;
  difficulty: SkillLevel;
  bpm: number;
  chordProgression: ChordProgressionBar[];
  genre: MusicGenre;
  durationSeconds: number;
}

export interface ChordProgressionBar {
  bar: number;
  chord: string;
  beats: number;
}

// ── User Profile & Progress ────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  skillLevel: SkillLevel;
  handedness: Handedness;
  goals: PracticeGoal[];
  genres: MusicGenre[];
  createdAt: number;
  streakDays: number;
  totalPracticeMinutes: number;
}

export interface LessonProgress {
  lessonId: string;
  completedAt?: number;
  score: number;          // 0–100
  accuracy: number;       // 0–1
  timingScore: number;    // 0–1
  attempts: number;
}

// ── Metronome ──────────────────────────────────────────────
export interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  currentBeat: number;
  timeSignature: [number, number];
  accentFirst: boolean;
}

// ── Tuner ──────────────────────────────────────────────────
export interface TunerState {
  isActive: boolean;
  frequency: number;
  closestNote: string;
  cents: number;          // deviation in cents from closest note
  inTune: boolean;
}
