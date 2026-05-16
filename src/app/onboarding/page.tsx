'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import type { SkillLevel, Handedness, PracticeGoal, MusicGenre, UserProfile } from '@/types';

// ─────────────────────────────────────────────────────────
//  Onboarding Flow — 5 steps
// ─────────────────────────────────────────────────────────

const STEPS = ['Welcome', 'Skill Level', 'Handedness', 'Goals', 'Music Style'];

interface OnboardingState {
  name: string;
  skillLevel: SkillLevel;
  handedness: Handedness;
  goals: PracticeGoal[];
  genres: MusicGenre[];
}

const defaultState: OnboardingState = {
  name: '',
  skillLevel: 'beginner',
  handedness: 'right',
  goals: ['chords'],
  genres: ['pop'],
};

const SKILL_LEVELS: { value: SkillLevel; label: string; desc: string; emoji: string }[] = [
  { value: 'beginner',    label: 'Complete Beginner', desc: 'Never picked up a guitar',    emoji: '🌱' },
  { value: 'intermediate',label: 'Some Experience',   desc: 'Know a few chords',            emoji: '🎸' },
  { value: 'advanced',    label: 'Experienced Player',desc: 'Comfortable with techniques', emoji: '🎵' },
];

const GOALS: { value: PracticeGoal; label: string; emoji: string }[] = [
  { value: 'chords',    label: 'Learn Chords',      emoji: '🤘' },
  { value: 'songs',     label: 'Play Songs',        emoji: '🎶' },
  { value: 'rhythm',    label: 'Rhythm & Timing',   emoji: '🥁' },
  { value: 'technique', label: 'Technique',         emoji: '🎯' },
  { value: 'theory',    label: 'Music Theory',      emoji: '📚' },
];

const GENRES: { value: MusicGenre; label: string; emoji: string }[] = [
  { value: 'pop',       label: 'Pop',      emoji: '🎤' },
  { value: 'rock',      label: 'Rock',     emoji: '🤘' },
  { value: 'folk',      label: 'Folk',     emoji: '🪕' },
  { value: 'blues',     label: 'Blues',    emoji: '🎷' },
  { value: 'classical', label: 'Classical',emoji: '🎼' },
  { value: 'country',   label: 'Country',  emoji: '🤠' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(defaultState);
  const { setUser, setOnboardingComplete, setCurrentView } = useAppStore();

  const updateState = useCallback(<K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayItem = useCallback(<T,>(key: keyof OnboardingState, item: T) => {
    setState(prev => {
      const arr = prev[key] as T[];
      const exists = arr.includes(item);
      return {
        ...prev,
        [key]: exists
          ? arr.filter(i => i !== item)
          : [...arr, item],
      };
    });
  }, []);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const complete = () => {
    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      name: state.name || 'Guitarist',
      skillLevel: state.skillLevel,
      handedness: state.handedness,
      goals: state.goals.length ? state.goals : ['chords'],
      genres: state.genres.length ? state.genres : ['pop'],
      createdAt: Date.now(),
      streakDays: 0,
      totalPracticeMinutes: 0,
    };
    setUser(profile);
    setOnboardingComplete(true);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0d0704] via-[#110b05] to-[#0a0604] px-4">
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #d4a853, transparent)' }} />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex items-center gap-2 justify-center mb-2">
          <span className="text-3xl">🎸</span>
          <span className="text-2xl font-black text-white tracking-tight">StringSense</span>
        </div>
        <p className="text-white/30 text-sm">Your guitar learning journey starts here</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm mb-8">
        <div className="flex justify-between text-xs text-white/30 mb-2">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step]}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #d4a853, #a07830)' }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* STEP 0 — Welcome */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-white mb-2">What should we call you?</h1>
                  <p className="text-white/40 text-sm">Personalize your learning experience</p>
                </div>
                <input
                  type="text"
                  placeholder="Your name..."
                  value={state.name}
                  onChange={e => updateState('name', e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/50 text-base"
                  maxLength={32}
                />
              </div>
            )}

            {/* STEP 1 — Skill Level */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-black text-white mb-2">Your experience level</h1>
                  <p className="text-white/40 text-sm">Honest answer helps us tailor lessons</p>
                </div>
                <div className="space-y-3">
                  {SKILL_LEVELS.map(s => (
                    <motion.button
                      key={s.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateState('skillLevel', s.value)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                      style={{
                        background: state.skillLevel === s.value
                          ? 'linear-gradient(135deg, rgba(212,168,83,0.2), rgba(160,120,48,0.1))'
                          : 'rgba(255,255,255,0.04)',
                        border: state.skillLevel === s.value
                          ? '1px solid rgba(212,168,83,0.5)'
                          : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="text-2xl">{s.emoji}</span>
                      <div>
                        <div className="text-white font-semibold text-sm">{s.label}</div>
                        <div className="text-white/40 text-xs">{s.desc}</div>
                      </div>
                      {state.skillLevel === s.value && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                          <span className="text-xs text-black font-bold">✓</span>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 — Handedness */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-white mb-2">Dominant hand?</h1>
                  <p className="text-white/40 text-sm">Sets up the fretboard orientation</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(['right', 'left'] as Handedness[]).map(h => (
                    <motion.button
                      key={h}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => updateState('handedness', h)}
                      className="flex flex-col items-center gap-3 p-6 rounded-xl"
                      style={{
                        background: state.handedness === h
                          ? 'linear-gradient(135deg, rgba(212,168,83,0.2), rgba(160,120,48,0.1))'
                          : 'rgba(255,255,255,0.04)',
                        border: state.handedness === h
                          ? '1px solid rgba(212,168,83,0.5)'
                          : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="text-4xl">{h === 'right' ? '🤜' : '🤛'}</span>
                      <span className="text-white font-semibold capitalize">{h}-handed</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3 — Goals */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-black text-white mb-2">What are your goals?</h1>
                  <p className="text-white/40 text-sm">Select all that apply</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map(g => {
                    const isSelected = state.goals.includes(g.value);
                    return (
                      <motion.button
                        key={g.value}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => toggleArrayItem('goals', g.value)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl"
                        style={{
                          background: isSelected ? 'rgba(212,168,83,0.15)' : 'rgba(255,255,255,0.04)',
                          border: isSelected ? '1px solid rgba(212,168,83,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <span className="text-white/80 text-xs font-medium text-center">{g.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4 — Genre */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-black text-white mb-2">Favourite music?</h1>
                  <p className="text-white/40 text-sm">We&apos;ll suggest relevant songs & chords</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {GENRES.map(g => {
                    const isSelected = state.genres.includes(g.value);
                    return (
                      <motion.button
                        key={g.value}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => toggleArrayItem('genres', g.value)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl"
                        style={{
                          background: isSelected ? 'rgba(212,168,83,0.15)' : 'rgba(255,255,255,0.04)',
                          border: isSelected ? '1px solid rgba(212,168,83,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <span className="text-white/70 text-xs">{g.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="w-full max-w-sm mt-8 flex gap-3">
        {step > 0 && (
          <button
            onClick={back}
            className="px-5 py-3 rounded-xl text-white/50 hover:text-white border border-white/10 text-sm font-medium transition-all"
          >
            Back
          </button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={step === STEPS.length - 1 ? complete : next}
          className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            background: 'linear-gradient(135deg, #d4a853, #a07830)',
            color: '#1a0f05',
            boxShadow: '0 4px 20px rgba(212,168,83,0.35)',
          }}
        >
          {step === STEPS.length - 1 ? "Let's Play! 🎸" : 'Continue →'}
        </motion.button>
      </div>
    </div>
  );
}
