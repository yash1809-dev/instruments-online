'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuitarStore } from '@/store';
import { useMetronome } from '@/hooks/useAudio';
import { Play, Pause, SkipForward, SkipBack, Volume2, ChevronUp, ChevronDown, Gauge, Radio } from 'lucide-react';

// ─────────────────────────────────────────────────────────
//  Practice Controls — Metronome + Tuner bar
// ─────────────────────────────────────────────────────────
export function PracticeControls({ className = '' }: { className?: string }) {
  const { toggle, setBpm, isPlaying, bpm, currentBeat } = useMetronome();
  const [showBpmInput, setShowBpmInput] = useState(false);
  const { metronome } = useGuitarStore();

  const handleBpmChange = (delta: number) => {
    setBpm(Math.max(20, Math.min(300, bpm + delta)));
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Metronome */}
      <div className="flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2 border border-white/10">
        <Gauge size={14} className="text-amber-400" />

        {/* BPM down */}
        <button
          onClick={() => handleBpmChange(-5)}
          className="text-white/60 hover:text-white transition-colors p-1"
        >
          <ChevronDown size={14} />
        </button>

        {/* BPM display */}
        <span className="font-mono text-sm font-bold text-white min-w-[36px] text-center">
          {bpm}
        </span>

        {/* BPM up */}
        <button
          onClick={() => handleBpmChange(5)}
          className="text-white/60 hover:text-white transition-colors p-1"
        >
          <ChevronUp size={14} />
        </button>

        {/* Play/Stop */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggle}
          className="ml-1 flex items-center justify-center rounded-lg transition-all"
          style={{
            width: 32, height: 32,
            background: isPlaying
              ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
              : 'linear-gradient(135deg, #d4a853, #a07830)',
            boxShadow: isPlaying ? '0 0 12px rgba(239,68,68,0.4)' : '0 0 10px rgba(212,168,83,0.3)',
          }}
        >
          {isPlaying ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white" />}
        </motion.button>

        {/* Beat indicator */}
        <div className="flex gap-1 ml-1">
          {[1, 2, 3, 4].map((beat) => (
            <motion.div
              key={beat}
              animate={{
                scale: isPlaying && currentBeat === beat ? 1.4 : 1,
                opacity: isPlaying && currentBeat === beat ? 1 : 0.3,
                backgroundColor: isPlaying && currentBeat === beat
                  ? (beat === 1 ? '#d4a853' : '#ffffff')
                  : '#ffffff',
              }}
              transition={{ duration: 0.05 }}
              className="rounded-full"
              style={{ width: 6, height: 6 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Volume & Reverb Controls
// ─────────────────────────────────────────────────────────
export function AudioControls({ className = '' }: { className?: string }) {
  const { volume, setVolume, reverbAmount, setReverb } = useGuitarStore();

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Volume2 size={14} className="text-white/50" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20 accent-amber-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <Radio size={14} className="text-white/50" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={reverbAmount}
          onChange={(e) => setReverb(parseFloat(e.target.value))}
          className="w-16 accent-purple-500"
        />
        <span className="text-white/40 text-xs">Rev</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Chord Selector Panel
// ─────────────────────────────────────────────────────────
import { CHORD_LIBRARY, BEGINNER_CHORDS, chordToAudioNotes } from '@/engine/audio/chords';
import { useAudioEngine } from '@/hooks/useAudio';

export function ChordSelector({ className = '' }: { className?: string }) {
  const { setActiveChord, activeChord, setFretting } = useGuitarStore();
  const { strum, ensureAudio } = useAudioEngine();
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const selectChord = useCallback(async (name: string) => {
    const chord = CHORD_LIBRARY[name];
    if (!chord) return;
    setSelectedName(name);
    setActiveChord(chord);
    const newFretting = Array.from({ length: 6 }, (_, s) => {
      if (chord.muted[s]) return -1;
      const pos = chord.positions.find(p => p.string === s);
      if (pos) return pos.fret;
      if (chord.open[s]) return 0;
      return -1;
    });
    setFretting(newFretting);
    await ensureAudio();
    const notes = chordToAudioNotes(chord, 0.65);
    await strum(notes, 'down');
  }, [setActiveChord, setFretting, ensureAudio, strum]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="text-white/40 text-xs font-medium uppercase tracking-wider px-1">Chords</p>
      <div className="flex flex-wrap gap-2">
        {BEGINNER_CHORDS.map((name) => (
          <motion.button
            key={name}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectChord(name)}
            className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
            style={{
              background: selectedName === name
                ? 'linear-gradient(135deg, #d4a853, #a07830)'
                : 'rgba(255,255,255,0.07)',
              color: selectedName === name ? '#1a0f05' : 'rgba(255,255,255,0.8)',
              border: selectedName === name ? 'none' : '1px solid rgba(255,255,255,0.12)',
              boxShadow: selectedName === name ? '0 0 14px rgba(212,168,83,0.4)' : 'none',
            }}
          >
            {name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Accuracy Ring — visual feedback on timing
// ─────────────────────────────────────────────────────────
export function AccuracyRing({ accuracy, size = 64 }: { accuracy: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;
  const color = accuracy >= 80 ? '#22c55e' : accuracy >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={4} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <span className="text-sm font-bold text-white">{Math.round(accuracy)}%</span>
    </div>
  );
}
