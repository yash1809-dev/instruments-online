'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GuitarStrumPanel } from '@/components/guitar/StrumPanel';
import { Fretboard } from '@/components/guitar/Fretboard';
import { PracticeControls, AudioControls, ChordSelector, AccuracyRing } from '@/components/guitar/Controls';
import { useGuitarStore, useAppStore } from '@/store';
import { CHORD_LIBRARY, BEGINNER_CHORDS } from '@/engine/audio/chords';
import {
  Settings, Home, ArrowLeft, RotateCcw, Eye, EyeOff,
  Hand, Volume1, Maximize2, ChevronLeft
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
//  Practice Screen — landscape-first, full immersive layout
// ─────────────────────────────────────────────────────────

function SettingsPanel({
  open, onClose
}: { open: boolean; onClose: () => void }) {
  const {
    showFretNumbers, toggleFretNumbers,
    showFingerDots, toggleFingerDots,
    leftHandedMode, toggleLeftHanded,
    volume, setVolume,
    reverbAmount, setReverb,
  } = useGuitarStore();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-sm rounded-t-3xl p-6 space-y-5"
            style={{ background: '#1a1008', border: '1px solid rgba(212,168,83,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base">Settings</h3>
              <button onClick={onClose} className="text-white/40 hover:text-white text-xl">×</button>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Show Fret Numbers', value: showFretNumbers, toggle: toggleFretNumbers, icon: Eye },
                { label: 'Show Finger Dots', value: showFingerDots, toggle: toggleFingerDots, icon: Eye },
                { label: 'Left-Handed Mode', value: leftHandedMode, toggle: toggleLeftHanded, icon: Hand },
              ].map(({ label, value, toggle, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-white/40" />
                    <span className="text-white/80 text-sm">{label}</span>
                  </div>
                  <button
                    onClick={toggle}
                    className="relative w-11 h-6 rounded-full transition-all"
                    style={{ background: value ? 'linear-gradient(135deg, #d4a853, #a07830)' : 'rgba(255,255,255,0.1)' }}
                  >
                    <motion.div
                      animate={{ x: value ? 22 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                    />
                  </button>
                </div>
              ))}

              <div className="space-y-3 pt-2 border-t border-white/5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Volume</span>
                    <span className="text-amber-400 font-mono">{Math.round(volume * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.01} value={volume}
                    onChange={e => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Reverb</span>
                    <span className="text-purple-400 font-mono">{Math.round(reverbAmount * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.01} value={reverbAmount}
                    onChange={e => setReverb(parseFloat(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────
//  Main Practice Screen
// ─────────────────────────────────────────────────────────
export default function PracticeScreen() {
  const { setCurrentView } = useAppStore();
  const { activeChord, audioReady, audioLatency } = useGuitarStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accuracy] = useState(78);
  const [mode, setMode] = useState<'chord' | 'free'>('chord');
  const [showHints, setShowHints] = useState(true);

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #0d0704 0%, #110b05 60%, #0a0604 100%)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Top Bar ───────────────────────────────────── */}
      <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-white/5">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} className="text-white/60" />
          </button>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Practice</p>
            {activeChord && (
              <p className="text-amber-400 text-xs mt-0.5">{activeChord.displayName}</p>
            )}
          </div>
        </div>

        {/* Center — Metronome */}
        <PracticeControls />

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Latency badge */}
          {audioReady && (
            <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-mono">{Math.round(audioLatency)}ms</span>
            </div>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Settings size={15} className="text-white/50" />
          </button>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Fretboard */}
        <div className="flex flex-col" style={{ width: '42%', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Mode selector */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            {(['chord', 'free'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: mode === m ? 'rgba(212,168,83,0.15)' : 'transparent',
                  color: mode === m ? '#d4a853' : 'rgba(255,255,255,0.35)',
                  border: mode === m ? '1px solid rgba(212,168,83,0.3)' : '1px solid transparent',
                }}
              >
                {m === 'chord' ? 'Chord Mode' : 'Free Play'}
              </button>
            ))}
          </div>

          {/* Chord selector */}
          {mode === 'chord' && (
            <div className="px-4 pb-3">
              <ChordSelector />
            </div>
          )}

          {/* Fretboard */}
          <div className="flex-1 px-4 pb-4 overflow-auto">
            <Fretboard
              chord={activeChord}
              interactive={mode === 'free'}
              className="h-full"
            />
          </div>
        </div>

        {/* RIGHT — Strumming zone */}
        <div className="flex-1 flex flex-col">
          {/* Strum area */}
          <div className="flex-1 relative">
            <GuitarStrumPanel className="absolute inset-2 rounded-2xl" />

            {/* Strum direction hints */}
            {showHints && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-none">
                <div className="flex items-center gap-1 text-white/20 text-xs">
                  <span>↓</span><span>Down</span>
                </div>
                <div className="flex items-center gap-1 text-white/20 text-xs">
                  <span>↑</span><span>Up</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="flex-none flex items-center justify-between px-4 py-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <AccuracyRing accuracy={accuracy} size={48} />
              <div>
                <p className="text-white/50 text-xs">Accuracy</p>
                <p className="text-white font-semibold text-sm">Keep it up!</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHints(!showHints)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                {showHints ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
