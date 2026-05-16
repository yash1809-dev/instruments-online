'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { GuitarStrumPanel } from '@/components/guitar/StrumPanel';
import { Fretboard } from '@/components/guitar/Fretboard';
import { PracticeControls } from '@/components/guitar/Controls';
import { useGuitarStore } from '@/store';
import { ChevronLeft, Settings } from 'lucide-react';

// ─────────────────────────────────────────────────────────
//  Free Play Mode — pure immersive guitar, minimal UI
// ─────────────────────────────────────────────────────────
export default function FreePlayPage() {
  const { setCurrentView } = useAppStore();
  const { audioReady, audioLatency } = useGuitarStore();
  const [showUI, setShowUI] = useState(true);

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: 'linear-gradient(160deg, #080502 0%, #0f0804 50%, #070401 100%)' }}
    >
      {/* Full-screen strum panel */}
      <GuitarStrumPanel className="absolute inset-0 rounded-none" />

      {/* Minimal overlay UI */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 pointer-events-auto"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10"
              >
                <ChevronLeft size={18} className="text-white/70" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm font-semibold">Free Play</span>
              </div>

              <div className="flex items-center gap-2">
                {audioReady && (
                  <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs font-mono">{Math.round(audioLatency)}ms</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom — metronome */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 pointer-events-auto"
              style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
              <PracticeControls />
            </div>

            {/* Tap hint — fades after first interaction */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.p
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 3, delay: 2 }}
                className="text-white/30 text-sm"
              >
                Swipe to strum · Tap to pluck
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
