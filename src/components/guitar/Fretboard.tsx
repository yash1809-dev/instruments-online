'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useGuitarStore } from '@/store';
import { useAudioEngine } from '@/hooks/useAudio';
import type { ChordDefinition, StringNumber } from '@/types';

// ─────────────────────────────────────────────────────────
//  Fretboard Component
//  Displays interactive guitar fretboard with finger dots
// ─────────────────────────────────────────────────────────

const FRET_COUNT = 5;   // visible frets
const STRING_COUNT = 6;

const FINGER_COLORS = ['#ef4444','#f97316','#eab308','#22c55e'];
const OPEN_STRING_FRETS = [0, 0, 0, 0, 0, 0];
const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];
const STRING_COLORS = ['#d4a853','#c8a045','#b8925e','#c0b060','#d0c888','#e8e0c0'];
const STRING_THICKNESS = [3.5, 3.0, 2.5, 2.0, 1.5, 1.0];

interface FretboardProps {
  chord?: ChordDefinition | null;
  startFret?: number;
  interactive?: boolean;
  compact?: boolean;
  className?: string;
}

export function Fretboard({
  chord,
  startFret = 0,
  interactive = true,
  compact = false,
  className = '',
}: FretboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { fretting, setFretForString, leftHandedMode, showFretNumbers, showFingerDots } = useGuitarStore();
  const { pluck, ensureAudio } = useAudioEngine();
  const [pressedDot, setPressedDot] = useState<string | null>(null);

  // Compute effective fretting from chord or interactive state
  const effectiveFretting = useCallback((): number[] => {
    if (!chord) return fretting;
    return Array.from({ length: 6 }, (_, s) => {
      if (chord.muted[s]) return -1;
      const pos = chord.positions.find(p => p.string === s);
      if (pos) return pos.fret;
      if (chord.open[s]) return 0;
      return -1;
    });
  }, [chord, fretting]);

  const activeFretting = effectiveFretting();

  const handleFretPress = useCallback(async (stringIdx: number, fret: number) => {
    if (!interactive) return;
    const dotKey = `${stringIdx}-${fret}`;
    setPressedDot(dotKey);
    setTimeout(() => setPressedDot(null), 200);
    setFretForString(stringIdx, fret);
    await ensureAudio();
    await pluck({ string: stringIdx as StringNumber, fret: fret as any, velocity: 0.6 });
  }, [interactive, setFretForString, ensureAudio, pluck]);

  const strings = leftHandedMode
    ? [...Array(STRING_COUNT).keys()].reverse()
    : Array.from({ length: STRING_COUNT }, (_, i) => i);

  const frets = Array.from({ length: FRET_COUNT }, (_, i) => startFret + i + 1);
  const fretWidth = compact ? 52 : 68;
  const stringSpacing = compact ? 36 : 48;
  const dotSize = compact ? 22 : 28;

  // Inlay dots (standard fretboard inlays at 3,5,7,9,12)
  const INLAY_FRETS = new Set([3, 5, 7, 9, 12]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{
        background: 'linear-gradient(180deg, #1c0f06 0%, #2a1508 50%, #1c0f06 100%)',
        borderRadius: 12,
        border: '1px solid rgba(180,130,60,0.2)',
        padding: compact ? '12px 8px' : '16px 12px',
        boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.8)',
      }}
    >
      {/* Nut */}
      {startFret === 0 && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: compact ? 44 : 56,
            width: 6,
            background: 'linear-gradient(180deg, #e8d8b0, #c8b880)',
            borderRadius: 2,
            boxShadow: '2px 0 6px rgba(0,0,0,0.4)',
          }}
        />
      )}

      {/* Fret position number */}
      {showFretNumbers && startFret > 0 && (
        <div className="absolute top-1 right-2 text-xs text-amber-400/60 font-mono">
          {startFret + 1}fr
        </div>
      )}

      {/* Fret wires */}
      <div className="relative" style={{
        marginLeft: compact ? 50 : 64,
        display: 'flex',
        flexDirection: 'row',
      }}>
        {frets.map((fret, fi) => (
          <div
            key={fret}
            className="relative"
            style={{ width: fretWidth, flexShrink: 0 }}
          >
            {/* Fret wire */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                right: 0,
                width: 2,
                background: 'linear-gradient(180deg, #888 0%, #ccc 40%, #888 100%)',
                boxShadow: '0 0 3px rgba(200,200,180,0.3)',
              }}
            />

            {/* Inlay dot */}
            {INLAY_FRETS.has(fret) && (
              <div
                className="absolute pointer-events-none"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'rgba(220,200,140,0.25)',
                  marginTop: (stringSpacing * 2.5),
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Strings + dots */}
      <div className="flex flex-col" style={{ gap: 0 }}>
        {strings.map((stringIdx) => {
          const fretted = activeFretting[stringIdx];
          const isMuted = fretted === -1;
          const isOpen = fretted === 0;
          const fingerPos = chord?.positions.find(p => p.string === stringIdx);

          return (
            <div
              key={stringIdx}
              className="relative flex items-center"
              style={{ height: stringSpacing }}
            >
              {/* String label */}
              <div
                className="absolute flex items-center justify-center font-mono text-xs"
                style={{
                  left: 0,
                  width: compact ? 44 : 56,
                  color: STRING_COLORS[stringIdx],
                  opacity: 0.8,
                }}
              >
                {isMuted ? (
                  <span className="text-red-500/70 font-bold text-sm">×</span>
                ) : isOpen ? (
                  <span className="text-green-400/70 font-bold text-sm">○</span>
                ) : (
                  <span>{STRING_LABELS[stringIdx]}</span>
                )}
              </div>

              {/* String line */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: compact ? 50 : 64,
                  right: 0,
                  height: STRING_THICKNESS[stringIdx],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: `linear-gradient(90deg, ${STRING_COLORS[stringIdx]}99, ${STRING_COLORS[stringIdx]}, ${STRING_COLORS[stringIdx]}99)`,
                  boxShadow: `0 0 4px ${STRING_COLORS[stringIdx]}44`,
                  opacity: isMuted ? 0.25 : 0.9,
                }}
              />

              {/* Fret dots / interaction zones */}
              <div
                className="flex items-center"
                style={{ marginLeft: compact ? 50 : 64 }}
              >
                {frets.map((fret, fi) => {
                  const isActive = !isMuted && fretted === fret;
                  const dotKey = `${stringIdx}-${fret}`;
                  const isPressed = pressedDot === dotKey;
                  const fingerNum = isActive ? fingerPos?.finger : undefined;

                  return (
                    <div
                      key={fret}
                      className="relative flex items-center justify-center"
                      style={{ width: fretWidth, height: stringSpacing }}
                      onClick={() => handleFretPress(stringIdx, fret)}
                    >
                      {/* Touch target */}
                      {interactive && (
                        <div
                          className="absolute inset-0 cursor-pointer"
                          style={{ zIndex: 2 }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            handleFretPress(stringIdx, fret);
                          }}
                        />
                      )}

                      {/* Finger dot */}
                      {showFingerDots && (isActive || isPressed) && (
                        <motion.div
                          initial={{ scale: 0.5 }}
                          animate={{ scale: isPressed ? 1.15 : 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="relative z-10 flex items-center justify-center rounded-full text-white font-bold"
                          style={{
                            width: dotSize,
                            height: dotSize,
                            fontSize: compact ? 10 : 12,
                            background: fingerNum
                              ? FINGER_COLORS[(fingerNum - 1) % 4]
                              : 'linear-gradient(135deg, #d4a853, #a07830)',
                            boxShadow: `0 2px 8px rgba(0,0,0,0.6), 0 0 ${isPressed ? 12 : 6}px rgba(212,168,83,0.5)`,
                          }}
                        >
                          {fingerNum ?? ''}
                        </motion.div>
                      )}

                      {/* Barre indicator */}
                      {chord?.barreStart === fret && (
                        <div
                          className="absolute inset-y-0 pointer-events-none z-5"
                          style={{
                            left: '50%',
                            width: 4,
                            background: 'linear-gradient(180deg, #d4a853, #a07830)',
                            opacity: 0.5,
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Chord Diagram — compact chord name display card
// ─────────────────────────────────────────────────────────
interface ChordDiagramProps {
  chord: ChordDefinition;
  isActive?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ChordDiagram({ chord, isActive, onClick, size = 'md' }: ChordDiagramProps) {
  const dotSize = size === 'sm' ? 12 : size === 'md' ? 16 : 22;
  const fretW = size === 'sm' ? 20 : size === 'md' ? 26 : 34;
  const strH = size === 'sm' ? 16 : size === 'md' ? 20 : 26;
  const FRETS = 4;

  const fretting = Array.from({ length: 6 }, (_, s) => {
    if (chord.muted[s]) return -1;
    const pos = chord.positions.find(p => p.string === s);
    if (pos) return pos.fret;
    if (chord.open[s]) return 0;
    return -1;
  });

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer flex flex-col items-center gap-1"
      style={{
        padding: size === 'sm' ? '8px 10px' : '12px 14px',
        borderRadius: 12,
        background: isActive
          ? 'linear-gradient(135deg, rgba(212,168,83,0.2), rgba(160,120,48,0.1))'
          : 'rgba(255,255,255,0.04)',
        border: isActive
          ? '1px solid rgba(212,168,83,0.5)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isActive ? '0 0 16px rgba(212,168,83,0.2)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <span className="font-bold text-amber-300" style={{ fontSize: size === 'sm' ? 12 : 14 }}>
        {chord.displayName}
      </span>

      {/* Mini diagram */}
      <div className="flex flex-row items-center gap-0">
        {Array.from({ length: 6 }, (_, s) => (
          <div key={s} className="flex flex-col items-center" style={{ width: fretW }}>
            {/* Open/muted indicator */}
            <div style={{ height: strH * 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {fretting[s] === -1 && <span className="text-red-400 font-bold" style={{ fontSize: dotSize * 0.7 }}>×</span>}
              {fretting[s] === 0 && <span className="text-green-400" style={{ fontSize: dotSize * 0.7 }}>○</span>}
            </div>

            {/* Nut */}
            <div style={{ width: fretW - 4, height: 2, background: '#c8b880', marginBottom: 1 }} />

            {/* Frets */}
            {Array.from({ length: FRETS }, (_, fi) => {
              const fretNum = fi + 1;
              const isHere = fretting[s] === fretNum;
              return (
                <div
                  key={fi}
                  className="relative flex items-center justify-center border-b"
                  style={{
                    width: fretW - 4,
                    height: strH,
                    borderColor: 'rgba(150,120,60,0.3)',
                  }}
                >
                  {/* String line */}
                  <div style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    left: '50%', width: 1,
                    background: `${STRING_COLORS[s]}66`,
                  }} />
                  {isHere && (
                    <div
                      className="relative z-10 rounded-full"
                      style={{
                        width: dotSize,
                        height: dotSize,
                        background: 'linear-gradient(135deg, #d4a853, #7a5820)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
