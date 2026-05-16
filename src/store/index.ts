import { create } from 'zustand';
import type {
  UserProfile, GuitarStringState, MetronomeState, ChordDefinition,
  SkillLevel, Handedness, PracticeGoal, MusicGenre, StringNumber, FretNumber,
} from '@/types';

// ─────────────────────────────────────────────────────────
//  Guitar String Physics State
// ─────────────────────────────────────────────────────────
const defaultStringState = (): GuitarStringState[] =>
  Array.from({ length: 6 }, (_, i) => ({
    index: i as StringNumber,
    isVibrating: false,
    vibrationAmplitude: 0,
    vibrationFreq: [82.41, 110, 146.83, 196, 246.94, 329.63][i],
    decayProgress: 1,
    isMuted: false,
    activeFret: 0,
    lastPlucked: 0,
  }));

// ─────────────────────────────────────────────────────────
//  Guitar Store
// ─────────────────────────────────────────────────────────
interface GuitarStore {
  // String states
  strings: GuitarStringState[];
  setStringVibrating: (index: number, amplitude: number) => void;
  setStringFret: (index: number, fret: FretNumber) => void;
  muteString: (index: number) => void;
  updateStringDecay: (index: number, decay: number) => void;

  // Active chord
  activeChord: ChordDefinition | null;
  setActiveChord: (chord: ChordDefinition | null) => void;

  // Fretted positions (index = string, value = fret number or -1 for muted)
  fretting: number[];
  setFretting: (fretting: number[]) => void;
  setFretForString: (stringIndex: number, fret: number) => void;

  // Metronome
  metronome: MetronomeState;
  setMetronomeBpm: (bpm: number) => void;
  toggleMetronome: () => void;
  setMetronomeBeat: (beat: number) => void;

  // UI state
  showFretNumbers: boolean;
  showFingerDots: boolean;
  leftHandedMode: boolean;
  reverbAmount: number;
  volume: number;
  toggleLeftHanded: () => void;
  setVolume: (vol: number) => void;
  setReverb: (amount: number) => void;
  toggleFretNumbers: () => void;
  toggleFingerDots: () => void;

  // Audio engine ready
  audioReady: boolean;
  setAudioReady: (ready: boolean) => void;
  audioLatency: number;
  setAudioLatency: (ms: number) => void;
}

export const useGuitarStore = create<GuitarStore>((set) => ({
  strings: defaultStringState(),

  setStringVibrating: (index, amplitude) =>
    set((state) => ({
      strings: state.strings.map((s) =>
        s.index === index
          ? { ...s, isVibrating: amplitude > 0.01, vibrationAmplitude: amplitude, lastPlucked: Date.now() }
          : s
      ),
    })),

  setStringFret: (index, fret) =>
    set((state) => ({
      strings: state.strings.map((s) =>
        s.index === index ? { ...s, activeFret: fret } : s
      ),
    })),

  muteString: (index) =>
    set((state) => ({
      strings: state.strings.map((s) =>
        s.index === index ? { ...s, isVibrating: false, vibrationAmplitude: 0, isMuted: true } : s
      ),
    })),

  updateStringDecay: (index, decay) =>
    set((state) => ({
      strings: state.strings.map((s) =>
        s.index === index ? { ...s, decayProgress: decay, isVibrating: decay < 0.98 } : s
      ),
    })),

  activeChord: null,
  setActiveChord: (chord) => set({ activeChord: chord }),

  fretting: [-1, -1, -1, -1, -1, -1],
  setFretting: (fretting) => set({ fretting }),
  setFretForString: (stringIndex, fret) =>
    set((state) => {
      const fretting = [...state.fretting];
      fretting[stringIndex] = fret;
      return { fretting };
    }),

  metronome: {
    isPlaying: false,
    bpm: 80,
    currentBeat: 1,
    timeSignature: [4, 4],
    accentFirst: true,
  },
  setMetronomeBpm: (bpm) =>
    set((state) => ({ metronome: { ...state.metronome, bpm: Math.max(20, Math.min(300, bpm)) } })),
  toggleMetronome: () =>
    set((state) => ({ metronome: { ...state.metronome, isPlaying: !state.metronome.isPlaying } })),
  setMetronomeBeat: (beat) =>
    set((state) => ({ metronome: { ...state.metronome, currentBeat: beat } })),

  showFretNumbers: true,
  showFingerDots: true,
  leftHandedMode: false,
  reverbAmount: 0.35,
  volume: 0.85,
  toggleLeftHanded: () => set((state) => ({ leftHandedMode: !state.leftHandedMode })),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  setReverb: (amount) => set({ reverbAmount: Math.max(0, Math.min(1, amount)) }),
  toggleFretNumbers: () => set((state) => ({ showFretNumbers: !state.showFretNumbers })),
  toggleFingerDots: () => set((state) => ({ showFingerDots: !state.showFingerDots })),

  audioReady: false,
  setAudioReady: (ready) => set({ audioReady: ready }),
  audioLatency: 0,
  setAudioLatency: (ms) => set({ audioLatency: ms }),
}));

// ─────────────────────────────────────────────────────────
//  User / App Store
// ─────────────────────────────────────────────────────────
interface AppStore {
  user: UserProfile | null;
  onboardingComplete: boolean;
  currentView: 'landing' | 'onboarding' | 'dashboard' | 'practice' | 'lesson' | 'freeplay' | 'songs';

  setUser: (user: UserProfile) => void;
  setOnboardingComplete: (done: boolean) => void;
  setCurrentView: (view: AppStore['currentView']) => void;
  updateUserProgress: (minutes: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  onboardingComplete: false,
  currentView: 'landing',

  setUser: (user) => set({ user }),
  setOnboardingComplete: (done) => set({ onboardingComplete: done }),
  setCurrentView: (view) => set({ currentView: view }),
  updateUserProgress: (minutes) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, totalPracticeMinutes: state.user.totalPracticeMinutes + minutes }
        : null,
    })),
}));

// ─────────────────────────────────────────────────────────
//  Lesson Store
// ─────────────────────────────────────────────────────────
interface LessonStore {
  activeLessonId: string | null;
  practiceChordIndex: number;
  accuracy: number;
  streak: number;
  sessionMinutes: number;

  setActiveLesson: (id: string | null) => void;
  nextChord: () => void;
  setAccuracy: (acc: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  incrementTime: () => void;
}

export const useLessonStore = create<LessonStore>((set) => ({
  activeLessonId: null,
  practiceChordIndex: 0,
  accuracy: 0,
  streak: 0,
  sessionMinutes: 0,

  setActiveLesson: (id) => set({ activeLessonId: id, practiceChordIndex: 0, accuracy: 0, streak: 0 }),
  nextChord: () => set((s) => ({ practiceChordIndex: s.practiceChordIndex + 1 })),
  setAccuracy: (acc) => set({ accuracy: acc }),
  incrementStreak: () => set((s) => ({ streak: s.streak + 1 })),
  resetStreak: () => set({ streak: 0 }),
  incrementTime: () => set((s) => ({ sessionMinutes: s.sessionMinutes + 1 })),
}));
