'use client';

import React, { Suspense, lazy, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/store';

// ── Lazy load each screen ──────────────────────────────────
const LandingPage   = lazy(() => import('./landing'));
const OnboardingPage = lazy(() => import('./onboarding/page'));
const Dashboard     = lazy(() => import('./dashboard/page'));
const PracticeScreen = lazy(() => import('./practice/page'));
const LessonPage    = lazy(() => import('./learn/page'));
const FreePlayPage  = lazy(() => import('./free-play/page'));

// ── Loading fallback ───────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0d0704, #110b05)' }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center gap-3"
      >
        <span className="text-4xl">🎸</span>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Page transition variants ───────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
};

// ── Wrapper for each view ──────────────────────────────────
function AnimatedView({ children, viewKey }: { children: React.ReactNode; viewKey: string }) {
  return (
    <motion.div
      key={viewKey}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="absolute inset-0 overflow-y-auto overflow-x-hidden"
    >
      {children}
    </motion.div>
  );
}

// ── Main App Router ────────────────────────────────────────
export default function AppRouter() {
  const { currentView } = useAppStore();

  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: '#0d0704' }}>
      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode="wait" initial={false}>
          {currentView === 'landing' && (
            <AnimatedView viewKey="landing">
              <div className="min-h-screen overflow-y-auto scroll-container">
                <LandingPage />
              </div>
            </AnimatedView>
          )}

          {currentView === 'onboarding' && (
            <AnimatedView viewKey="onboarding">
              <OnboardingPage />
            </AnimatedView>
          )}

          {currentView === 'dashboard' && (
            <AnimatedView viewKey="dashboard">
              <div className="h-screen overflow-y-auto scroll-container">
                <Dashboard />
              </div>
            </AnimatedView>
          )}

          {currentView === 'practice' && (
            <AnimatedView viewKey="practice">
              <PracticeScreen />
            </AnimatedView>
          )}

          {currentView === 'lesson' && (
            <AnimatedView viewKey="lesson">
              <div className="h-screen overflow-y-auto scroll-container">
                <LessonPage />
              </div>
            </AnimatedView>
          )}

          {currentView === 'freeplay' && (
            <AnimatedView viewKey="freeplay">
              <FreePlayPage />
            </AnimatedView>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
