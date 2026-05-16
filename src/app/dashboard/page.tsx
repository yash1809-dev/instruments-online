'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore, useGuitarStore } from '@/store';
import { CHORD_LIBRARY, CHORD_PROGRESSIONS } from '@/engine/audio/chords';
import { useAudioEngine } from '@/hooks/useAudio';
import { chordToAudioNotes } from '@/engine/audio/chords';
import { ChordDiagram } from '@/components/guitar/Fretboard';
import {
  Play, Music2, BookOpen, Zap, TrendingUp, Clock,
  Flame, Target, ChevronRight, Star
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
//  Dashboard
// ─────────────────────────────────────────────────────────

const LESSONS = [
  { id: 'em-am', title: 'Em → Am Transition', type: 'chord', diff: 1, duration: 5, emoji: '🎯' },
  { id: 'g-c-d', title: 'G, C, D Progression', type: 'chord', diff: 2, duration: 8, emoji: '🎶' },
  { id: 'strum-basic', title: 'Down-Up Strumming', type: 'strumming', diff: 1, duration: 6, emoji: '🎸' },
  { id: 'rhythm-4-4', title: '4/4 Rhythm Basics', type: 'rhythm', diff: 1, duration: 7, emoji: '🥁' },
  { id: 'barre-f', title: 'F Barre Chord', type: 'chord', diff: 4, duration: 12, emoji: '💪' },
  { id: 'song-let-it-be', title: 'Let It Be — Beatles', type: 'song', diff: 2, duration: 15, emoji: '🎼' },
];

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ background: i <= level ? '#d4a853' : 'rgba(255,255,255,0.1)' }} />
      ))}
    </div>
  );
}

function QuickChordCard({ name, onPlay }: { name: string; onPlay: (name: string) => void }) {
  const chord = CHORD_LIBRARY[name];
  if (!chord) return null;
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onPlay(name)}
      className="flex-none"
    >
      <ChordDiagram chord={chord} size="sm" />
    </motion.button>
  );
}

export default function Dashboard() {
  const { user, setCurrentView } = useAppStore();
  const { setActiveChord, setFretting } = useGuitarStore();
  const { strum, ensureAudio } = useAudioEngine();

  const quickPlay = async (chordName: string) => {
    const chord = CHORD_LIBRARY[chordName];
    if (!chord) return;
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
    await strum(chordToAudioNotes(chord, 0.7), 'down');
  };

  const name = user?.name ?? 'Guitarist';
  const streak = user?.streakDays ?? 0;
  const minutes = user?.totalPracticeMinutes ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #0d0704 0%, #110b05 50%, #0a0604 100%)' }}
    >
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-5 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d4a853, transparent)' }} />
      </div>

      <div className="relative z-10 px-4 pb-24">
        {/* Header */}
        <div className="pt-6 pb-4 flex items-start justify-between">
          <div>
            <p className="text-white/40 text-sm">{greeting},</p>
            <h1 className="text-2xl font-black text-white mt-0.5">{name} 👋</h1>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #d4a853, #7a5820)' }}>
            <span className="text-lg">🎸</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <Flame size={14} className="text-orange-400" />, val: `${streak}d`, label: 'Streak', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
            { icon: <Clock size={14} className="text-blue-400" />, val: `${minutes}m`, label: 'Practice', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
            { icon: <Target size={14} className="text-green-400" />, val: '78%', label: 'Accuracy', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
          ].map(({ icon, val, label, bg, border }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
              <div className="text-lg font-black text-white">{val}</div>
              <div className="text-white/40 text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Continue Practice CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentView('practice')}
          className="w-full flex items-center justify-between p-5 rounded-2xl mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(212,168,83,0.2) 0%, rgba(160,120,48,0.1) 100%)',
            border: '1px solid rgba(212,168,83,0.3)',
            boxShadow: '0 0 30px rgba(212,168,83,0.1)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #d4a853, #a07830)' }}>
              <Play size={20} className="text-[#1a0f05]" fill="#1a0f05" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Continue Practice</p>
              <p className="text-white/40 text-xs mt-0.5">G — C — D Progression</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-amber-400" />
        </motion.button>

        {/* Quick chord play */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-base">Quick Chords</h2>
            <button className="text-white/30 text-xs hover:text-white/60" onClick={() => setCurrentView('practice')}>
              View all →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {['Em', 'Am', 'G', 'C', 'D', 'A', 'E'].map(name => (
              <QuickChordCard key={name} name={name} onPlay={quickPlay} />
            ))}
          </div>
        </div>

        {/* Lessons */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-base">Lessons</h2>
            <button className="text-white/30 text-xs hover:text-white/60" onClick={() => setCurrentView('lesson')}>
              All lessons →
            </button>
          </div>
          <div className="space-y-2">
            {LESSONS.slice(0, 4).map((lesson, i) => (
              <motion.button
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setCurrentView('lesson')}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <span className="text-2xl">{lesson.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{lesson.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <DifficultyDots level={lesson.diff} />
                    <span className="text-white/30 text-xs">{lesson.duration} min</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/20 flex-none" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Free play */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentView('freeplay')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl"
          style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.2)' }}>
            <Zap size={18} className="text-purple-400" />
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm">Free Play Mode</p>
            <p className="text-white/40 text-xs">Pure immersion, no guides</p>
          </div>
          <ChevronRight size={16} className="text-purple-400 ml-auto" />
        </motion.button>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 backdrop-blur-xl"
        style={{ background: 'rgba(13,7,4,0.9)' }}>
        <div className="flex items-center justify-around px-4 py-3">
          {[
            { icon: <TrendingUp size={20} />, label: 'Dashboard', view: 'dashboard' as const },
            { icon: <BookOpen size={20} />, label: 'Lessons', view: 'lesson' as const },
            { icon: <Music2 size={20} />, label: 'Practice', view: 'practice' as const },
            { icon: <Star size={20} />, label: 'Free Play', view: 'freeplay' as const },
          ].map(({ icon, label, view }) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className="flex flex-col items-center gap-1 transition-all"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {icon}
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
