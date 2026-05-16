'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, useGuitarStore } from '@/store';
import { Fretboard } from '@/components/guitar/Fretboard';
import { GuitarStrumPanel } from '@/components/guitar/StrumPanel';
import { AccuracyRing } from '@/components/guitar/Controls';
import { CHORD_LIBRARY, BEGINNER_CHORDS, CHORD_PROGRESSIONS, chordToAudioNotes } from '@/engine/audio/chords';
import { useAudioEngine } from '@/hooks/useAudio';
import { ChevronLeft, ChevronRight, Check, Play, RotateCcw } from 'lucide-react';
import type { ChordDefinition } from '@/types';

// ─────────────────────────────────────────────────────────
//  Lesson Screen — animated finger guidance + chord transitions
// ─────────────────────────────────────────────────────────

const LESSON_STEPS = [
  {
    title: 'Em — The Starting Chord',
    description: 'Place fingers 2 & 3 on strings A and D, fret 2. All other strings ring open.',
    chord: 'Em',
    tip: 'Keep fingers arched, press near the fret wire for clean sound',
    targetStrums: 4,
  },
  {
    title: 'Am — Minor Switch',
    description: 'Move finger 1 to string B fret 1, fingers 2 & 3 on D and A fret 2.',
    chord: 'Am',
    tip: 'Transition from Em by lifting finger 1 and shifting down one string',
    targetStrums: 4,
  },
  {
    title: 'Em → Am Transition',
    description: 'Practice switching between Em and Am fluidly every 2 beats.',
    chord: 'Em',
    tip: 'Anticipate the next chord — start moving fingers before the beat',
    targetStrums: 8,
  },
];

export default function LessonPage() {
  const { setCurrentView } = useAppStore();
  const { setActiveChord, setFretting } = useGuitarStore();
  const { strum, ensureAudio } = useAudioEngine();

  const [stepIndex, setStepIndex] = useState(0);
  const [strumCount, setStrumCount] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [completed, setCompleted] = useState(false);
  const step = LESSON_STEPS[stepIndex];
  const chord = CHORD_LIBRARY[step.chord];

  const activateChord = (c: ChordDefinition) => {
    setActiveChord(c);
    const fretting = Array.from({ length: 6 }, (_, s) => {
      if (c.muted[s]) return -1;
      const pos = c.positions.find(p => p.string === s);
      if (pos) return pos.fret;
      if (c.open[s]) return 0;
      return -1;
    });
    setFretting(fretting);
  };

  React.useEffect(() => {
    if (chord) activateChord(chord);
  }, [stepIndex]);

  const handleStrum = async () => {
    if (!chord) return;
    await ensureAudio();
    await strum(chordToAudioNotes(chord, 0.7), 'down');
    const newCount = strumCount + 1;
    setStrumCount(newCount);
    setAccuracy(Math.min(100, accuracy + Math.random() * 8 + 5));

    if (newCount >= step.targetStrums) {
      if (stepIndex < LESSON_STEPS.length - 1) {
        setTimeout(() => {
          setStepIndex(s => s + 1);
          setStrumCount(0);
        }, 800);
      } else {
        setCompleted(true);
      }
    }
  };

  if (completed) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0d0704] to-[#110b05] px-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-black text-white mb-2">Lesson Complete!</h2>
          <p className="text-white/50 text-sm mb-8">Great work on the Em → Am transition</p>
          <AccuracyRing accuracy={accuracy} size={96} />
          <p className="text-white/40 text-xs mt-4 mb-8">Overall Accuracy</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setStepIndex(0); setStrumCount(0); setAccuracy(0); setCompleted(false); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/60 text-sm"
            >
              <RotateCcw size={14} /> Retry
            </button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #d4a853, #a07830)', color: '#1a0f05' }}
            >
              Next Lesson <ChevronRight size={16} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d0704 0%, #110b05 60%, #0a0604 100%)' }}>

      {/* Header */}
      <div className="flex-none flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <button onClick={() => setCurrentView('dashboard')}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
          <ChevronLeft size={16} className="text-white/60" />
        </button>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Em → Am Lesson</p>
          <div className="flex gap-1 mt-1">
            {LESSON_STEPS.map((_, i) => (
              <div key={i} className="h-0.5 flex-1 rounded-full"
                style={{ background: i <= stepIndex ? 'linear-gradient(90deg, #d4a853, #a07830)' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>
        <AccuracyRing accuracy={accuracy} size={40} />
      </div>

      {/* Step content */}
      <div className="flex-none px-4 pt-4 pb-3">
        <AnimatePresence mode="wait">
          <motion.div key={stepIndex}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}>
            <h2 className="text-white font-black text-base mb-1">{step.title}</h2>
            <p className="text-white/50 text-xs leading-relaxed">{step.description}</p>
            <div className="mt-2 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
              <p className="text-amber-300 text-xs">💡 {step.tip}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #d4a853, #22c55e)' }}
              animate={{ width: `${(strumCount / step.targetStrums) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-white/40 text-xs font-mono">{strumCount}/{step.targetStrums}</span>
        </div>
      </div>

      {/* Fretboard */}
      <div className="flex-none px-4 pb-3">
        <Fretboard chord={chord} interactive={false} compact className="rounded-2xl" />
      </div>

      {/* Strum area */}
      <div className="flex-1 relative">
        <GuitarStrumPanel className="absolute inset-4 rounded-2xl" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.p
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/40 text-xs text-center"
          >
            Swipe down to strum • {step.targetStrums - strumCount} strums left
          </motion.p>
        </div>
      </div>
    </div>
  );
}
