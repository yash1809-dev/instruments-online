'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { GuitarStrumPanel } from '@/components/guitar/StrumPanel';
import { Fretboard } from '@/components/guitar/Fretboard';
import { PracticeControls, AudioControls, ChordSelector } from '@/components/guitar/Controls';
import { useGuitarStore } from '@/store';
import { ArrowRight, Music, BookOpen, Zap, Play, Sparkles, ChevronDown } from 'lucide-react';

// ─────────────────────────────────────────────────────────
//  Mini hero guitar preview
// ─────────────────────────────────────────────────────────
function HeroGuitar() {
  return (
    <div className="relative w-full max-w-xs mx-auto" style={{ height: 260 }}>
      <div className="absolute inset-0 rounded-3xl opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #d4a853 0%, transparent 70%)' }} />
      <div className="relative rounded-3xl overflow-hidden border border-amber-400/20 shadow-2xl" style={{ height: '100%' }}>
        <GuitarStrumPanel className="h-full" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-amber-400/20 rounded-full px-4 py-1.5 text-xs text-amber-300 font-medium whitespace-nowrap"
      >
        ✨ Tap or swipe to play
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col gap-3 p-5 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(212,168,83,0.12)', border: '1px solid rgba(212,168,83,0.2)' }}>
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
        <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { setCurrentView } = useAppStore();

  return (
    <div className="min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #0d0704 0%, #110b05 50%, #0a0604 100%)' }}>

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, #d4a853, transparent)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 11, repeat: Infinity, delay: 3 }}
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, #a07830, transparent)' }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎸</span>
          <span className="text-lg font-black text-white tracking-tight">StringSense</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCurrentView('onboarding')}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #d4a853, #a07830)', color: '#1a0f05', boxShadow: '0 0 14px rgba(212,168,83,0.35)' }}
        >
          Get Started
        </motion.button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-8 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={12} className="text-amber-400" />
            <span className="text-amber-300 text-xs font-medium">Real Guitar Feel on Glass</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
            Learn guitar like<br />
            <span className="gradient-text">never before</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed mb-10">
            The world&apos;s most realistic touch-based guitar simulator. Ultra-low latency. Built for mobile.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }} className="mb-14">
          <HeroGuitar />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentView('onboarding')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold w-full max-w-xs justify-center"
            style={{ background: 'linear-gradient(135deg, #d4a853, #a07830)', color: '#1a0f05', boxShadow: '0 8px 30px rgba(212,168,83,0.4)' }}
          >
            Start Learning Free <ArrowRight size={18} />
          </motion.button>
          <button onClick={() => setCurrentView('freeplay')} className="text-white/40 text-sm hover:text-white/70 transition-colors">
            Jump straight to free play →
          </button>
        </motion.div>

        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mt-12 flex justify-center">
          <ChevronDown size={20} className="text-white/20" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 py-8 border-y border-white/5">
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
          {[
            { value: '<20ms', label: 'Audio Latency' },
            { value: '60fps', label: 'Rendering' },
            { value: '100%', label: 'Touch Native' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="text-xl font-black text-amber-400">{stat.value}</div>
              <div className="text-white/30 text-xs mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-12">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-xl font-black text-white mb-6 text-center">
          Everything you need to learn
        </motion.h2>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <FeatureCard icon={<Zap size={18} className="text-amber-400" />} title="Ultra-Low Latency" desc="Karplus-Strong synthesis under 20ms" delay={0.1} />
          <FeatureCard icon={<Music size={18} className="text-amber-400" />} title="Real Chords" desc="Full chord library with fingering guides" delay={0.2} />
          <FeatureCard icon={<BookOpen size={18} className="text-amber-400" />} title="Guided Lessons" desc="Step-by-step structured learning path" delay={0.3} />
          <FeatureCard icon={<Play size={18} className="text-amber-400" />} title="Free Play" desc="Pure immersive instrument mode" delay={0.4} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-xs mx-auto p-8 rounded-3xl border border-amber-400/15"
          style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.08), rgba(160,120,48,0.04))' }}>
          <span className="text-4xl block mb-4">🎸</span>
          <h2 className="text-xl font-black text-white mb-3">Ready to start?</h2>
          <p className="text-white/40 text-xs mb-6 leading-relaxed">
            No hardware needed. Start playing instantly on your phone.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentView('onboarding')}
            className="w-full py-3.5 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #d4a853, #a07830)', color: '#1a0f05', boxShadow: '0 4px 20px rgba(212,168,83,0.35)' }}
          >
            Begin Your Journey →
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
}
