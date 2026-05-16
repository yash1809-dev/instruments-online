'use client';

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuitarStore } from '@/store';
import { useAudioEngine, useStringVibration } from '@/hooks/useAudio';
import { TouchEngine } from '@/engine/touch/TouchEngine';
import { chordToAudioNotes } from '@/engine/audio/chords';
import type { GestureEvent, StringNumber, FretNumber } from '@/types';

// ─────────────────────────────────────────────────────────
//  String colors (low E → high e)
// ─────────────────────────────────────────────────────────
const STRING_COLORS = [
  '#d4a853', // low E  — warm gold
  '#c8a045', // A      — gold
  '#b8925e', // D      — bronze
  '#c0b060', // G      — brass
  '#d0c888', // B      — silver-gold
  '#e8e0c0', // high e — silver
];

const STRING_THICKNESS = [4.5, 3.8, 3.2, 2.6, 1.8, 1.2]; // px
const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];

// ─────────────────────────────────────────────────────────
//  Individual String Component
// ─────────────────────────────────────────────────────────
interface StringProps {
  index: number;
  width: number;
  height: number;
  isVibrating: boolean;
  amplitude: number;
  color: string;
  thickness: number;
  label: string;
  isMuted: boolean;
  onStringTouch: (index: number, force: number) => void;
}

function GuitarString({ index, width, height, isVibrating, amplitude, color, thickness, label, isMuted, onStringTouch }: StringProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(Math.random() * Math.PI * 2);
  const ampRef = useRef(0);
  const startTimeRef = useRef(0);

  // Animate string wave on canvas
  useEffect(() => {
    if (isVibrating && amplitude > 0.01) {
      ampRef.current = amplitude;
      startTimeRef.current = performance.now();
    }
  }, [isVibrating, amplitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      const decay = Math.max(0, 1 - elapsed / 3000);
      const currentAmp = ampRef.current * decay;

      ctx.clearRect(0, 0, width, height);

      // String base line
      const y = height / 2;

      if (currentAmp < 0.005 || isMuted) {
        // Static string
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = isMuted ? 'rgba(100,100,100,0.4)' : color;
        ctx.lineWidth = thickness;
        ctx.stroke();
      } else {
        // Vibrating wave (multiple harmonics for realism)
        const freq = 0.008 + index * 0.002;
        const speed = 1200 + index * 200;
        const t = elapsed * 0.001;

        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const progress = x / width;
          // Fundamental + 2nd harmonic
          const wave1 = Math.sin(Math.PI * progress + t * speed * freq * Math.PI * 2) * Math.sin(Math.PI * progress);
          const wave2 = Math.sin(Math.PI * 2 * progress + t * speed * freq * Math.PI * 2 * 2) * Math.sin(Math.PI * progress) * 0.3;
          const wave = (wave1 + wave2) * currentAmp * 18;
          const wy = y + wave;
          x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
        }

        // Glowing string effect
        const gradient = ctx.createLinearGradient(0, y - 10, 0, y + 10);
        gradient.addColorStop(0, `${color}00`);
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, `${color}00`);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.shadowColor = color;
        ctx.shadowBlur = currentAmp * 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Glow overlay
        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const progress = x / width;
          const wave1 = Math.sin(Math.PI * progress + t * speed * freq * Math.PI * 2) * Math.sin(Math.PI * progress);
          const wave2 = Math.sin(Math.PI * 2 * progress + t * speed * freq * Math.PI * 2 * 2) * Math.sin(Math.PI * progress) * 0.3;
          const wave = (wave1 + wave2) * currentAmp * 18;
          const wy = y + wave;
          x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
        }
        ctx.strokeStyle = `rgba(255,255,255,${currentAmp * 0.3})`;
        ctx.lineWidth = thickness * 0.5;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [width, height, color, thickness, index, isMuted]);

  return (
    <div
      className="relative flex items-center"
      style={{ width, height, cursor: 'crosshair' }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Strumming Area — main touch zone
// ─────────────────────────────────────────────────────────
interface StrumAreaProps {
  onStrum: (direction: 'down' | 'up', velocity: number) => void;
  onPluck: (stringIndex: number, velocity: number) => void;
  strings: Array<{ isVibrating: boolean; amplitude: number; isMuted: boolean; activeFret: number }>;
}

export function StrumArea({ onStrum, onPluck, strings }: StrumAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchEngineRef = useRef<TouchEngine | null>(null);
  const [strumEffect, setStrumEffect] = useState<{ y: number; dir: 'down' | 'up'; id: number } | null>(null);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const rippleCounterRef = useRef(0);

  const width = containerRef.current?.offsetWidth ?? 280;
  const height = containerRef.current?.offsetHeight ?? 400;

  const STRING_GAP = height / 7;
  const stringZones = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    top: STRING_GAP * (i + 0.5),
    bottom: STRING_GAP * (i + 1.5),
    index: i,
  })), [STRING_GAP]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const engine = new TouchEngine();
    touchEngineRef.current = engine;

    engine.setStringZones(stringZones);

    engine.attach(
      el,
      (gesture: GestureEvent) => {
        if (gesture.type === 'strum-down') {
          onStrum('down', gesture.velocity);
          setStrumEffect({ y: gesture.swipe?.startY ?? height / 2, dir: 'down', id: Date.now() });
        } else if (gesture.type === 'strum-up') {
          onStrum('up', gesture.velocity);
          setStrumEffect({ y: gesture.swipe?.startY ?? height / 2, dir: 'up', id: Date.now() });
        }
      },
      (stringIndex, x, y, force) => {
        onPluck(stringIndex, force);
        const id = ++rippleCounterRef.current;
        setRipples((r) => [...r.slice(-5), { x, y, id }]);
        setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
      }
    );

    return () => engine.detach();
  }, [stringZones, onStrum, onPluck, height]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden"
      style={{ touchAction: 'none', background: 'transparent' }}
    >
      {/* String lines overlay */}
      {strings.map((str, i) => {
        const y = STRING_GAP * (i + 1);
        return (
          <GuitarString
            key={i}
            index={i}
            width={width}
            height={STRING_GAP}
            isVibrating={str.isVibrating}
            amplitude={str.amplitude}
            color={STRING_COLORS[i]}
            thickness={STRING_THICKNESS[i]}
            label={STRING_LABELS[i]}
            isMuted={str.isMuted}
            onStringTouch={onPluck}
          />
        );
      })}

      {/* Strum effect */}
      <AnimatePresence>
        {strumEffect && (
          <motion.div
            key={strumEffect.id}
            className="absolute left-0 right-0 pointer-events-none"
            style={{ top: 0 }}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div
              className="absolute left-0 right-0 h-px"
              style={{
                top: strumEffect.y,
                background: strumEffect.dir === 'down'
                  ? 'linear-gradient(90deg, transparent, rgba(212,168,83,0.8), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(200,160,100,0.6), transparent)',
                boxShadow: '0 0 8px rgba(212,168,83,0.6)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch ripples */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            className="absolute rounded-full pointer-events-none border border-amber-400/60"
            style={{ left: r.x - 20, top: r.y - 20, width: 40, height: 40 }}
            initial={{ scale: 0.3, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* String labels */}
      <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-around pointer-events-none">
        {STRING_LABELS.map((label, i) => (
          <span key={i} className="text-xs font-mono" style={{ color: `${STRING_COLORS[i]}cc` }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Full Guitar Strum Panel — combines strings + touch zone
// ─────────────────────────────────────────────────────────
interface GuitarStrumPanelProps {
  className?: string;
}

export function GuitarStrumPanel({ className }: GuitarStrumPanelProps) {
  const strings = useGuitarStore((s) => s.strings);
  const fretting = useGuitarStore((s) => s.fretting);
  const activeChord = useGuitarStore((s) => s.activeChord);
  const setStringVibrating = useGuitarStore((s) => s.setStringVibrating);
  const { strum, pluck, ensureAudio } = useAudioEngine();

  const handleStrum = useCallback(async (direction: 'down' | 'up', velocity: number) => {
    await ensureAudio();

    let notes: Array<{ string: StringNumber; fret: FretNumber; velocity: number }> = [];

    if (activeChord) {
      notes = chordToAudioNotes(activeChord, velocity);
    } else {
      // Open strings or current fretting
      notes = fretting.map((fret, s) => {
        if (fret < 0) return null;
        return { string: s as StringNumber, fret: Math.max(0, fret) as FretNumber, velocity: velocity * (0.9 + Math.random() * 0.1) };
      }).filter(Boolean) as typeof notes;

      if (notes.length === 0) {
        notes = Array.from({ length: 6 }, (_, s) => ({ string: s as StringNumber, fret: 0 as FretNumber, velocity }));
      }
    }

    await strum(notes, direction);

    // Animate all strings
    notes.forEach((note) => {
      setStringVibrating(note.string, velocity);
    });
  }, [activeChord, fretting, strum, ensureAudio, setStringVibrating]);

  const handlePluck = useCallback(async (stringIndex: number, force: number) => {
    await ensureAudio();
    const fret = activeChord
      ? (activeChord.positions.find(p => p.string === stringIndex)?.fret ?? (activeChord.open[stringIndex] ? 0 : -1))
      : Math.max(0, fretting[stringIndex] ?? 0);

    if (fret < 0) return;

    await pluck({ string: stringIndex as StringNumber, fret: fret as any, velocity: Math.max(0.3, force) });
    setStringVibrating(stringIndex, Math.max(0.3, force));
  }, [activeChord, fretting, pluck, ensureAudio, setStringVibrating]);

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, #1a0f05 0%, #2d1a08 40%, #1a0f05 100%)',
        border: '1px solid rgba(212,168,83,0.15)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(212,168,83,0.05)',
      }}
    >
      {/* Wood grain texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(212,168,83,0.3) 2px, rgba(212,168,83,0.3) 3px)`,
        }}
      />

      {/* Sound hole decorative element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
        <div className="w-32 h-32 rounded-full border-8 border-amber-400" />
        <div className="absolute inset-4 rounded-full border-4 border-amber-400" />
        <div className="absolute inset-8 rounded-full border-2 border-amber-400" />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-around py-4 px-2">
        <StrumArea
          onStrum={handleStrum}
          onPluck={handlePluck}
          strings={strings.map((s) => ({
            isVibrating: s.isVibrating,
            amplitude: s.vibrationAmplitude,
            isMuted: s.isMuted,
            activeFret: s.activeFret,
          }))}
        />
      </div>

      {/* Nut (top edge) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />
      {/* Bridge (bottom edge) */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />
    </div>
  );
}
