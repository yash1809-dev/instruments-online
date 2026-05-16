'use client';
import { useRef, useEffect, useCallback } from 'react';
import { getAudioEngine } from '@/engine/audio/AudioEngine';
import { Metronome } from '@/engine/audio/Metronome';
import { useGuitarStore } from '@/store';
import type { AudioNote } from '@/types';

// ── useAudioEngine hook ────────────────────────────────────
export function useAudioEngine() {
  const setAudioReady = useGuitarStore((s) => s.setAudioReady);
  const setAudioLatency = useGuitarStore((s) => s.setAudioLatency);
  const volume = useGuitarStore((s) => s.volume);
  const reverbAmount = useGuitarStore((s) => s.reverbAmount);
  const engineRef = useRef(getAudioEngine());
  const initializedRef = useRef(false);

  const ensureAudio = useCallback(async () => {
    const engine = engineRef.current;
    await engine.ensureRunning();
    if (!initializedRef.current) {
      initializedRef.current = true;
      engine.setMasterVolume(volume);
      engine.setReverbAmount(reverbAmount);
      setAudioReady(true);
      setAudioLatency(engine.getLatency());
    }
  }, [volume, reverbAmount, setAudioReady, setAudioLatency]);

  useEffect(() => {
    const engine = engineRef.current;
    engine.setMasterVolume(volume);
  }, [volume]);

  useEffect(() => {
    const engine = engineRef.current;
    engine.setReverbAmount(reverbAmount);
  }, [reverbAmount]);

  const pluck = useCallback(async (note: AudioNote) => {
    await ensureAudio();
    engineRef.current.pluck(note);
  }, [ensureAudio]);

  const strum = useCallback(async (notes: AudioNote[], direction: 'down' | 'up' = 'down') => {
    await ensureAudio();
    engineRef.current.strum(notes, direction);
  }, [ensureAudio]);

  const muteString = useCallback((index: number) => {
    engineRef.current.muteString(index);
  }, []);

  const muteAll = useCallback(() => {
    engineRef.current.muteAll();
  }, []);

  return { pluck, strum, muteString, muteAll, ensureAudio, engine: engineRef.current };
}

// ── useMetronome hook ──────────────────────────────────────
export function useMetronome() {
  const metronomeRef = useRef<Metronome | null>(null);
  const { metronome, setMetronomeBeat, toggleMetronome, setMetronomeBpm } = useGuitarStore();

  useEffect(() => {
    metronomeRef.current = new Metronome();
    return () => { metronomeRef.current?.stop(); };
  }, []);

  useEffect(() => {
    metronomeRef.current?.setBpm(metronome.bpm);
  }, [metronome.bpm]);

  const start = useCallback(async () => {
    const m = metronomeRef.current;
    if (!m) return;
    await m.start((beat, time, isAccent) => {
      setMetronomeBeat(beat);
    });
  }, [setMetronomeBeat]);

  const stop = useCallback(() => {
    metronomeRef.current?.stop();
  }, []);

  const toggle = useCallback(async () => {
    if (metronome.isPlaying) {
      stop();
    } else {
      await start();
    }
    toggleMetronome();
  }, [metronome.isPlaying, start, stop, toggleMetronome]);

  const setBpm = useCallback((bpm: number) => {
    setMetronomeBpm(bpm);
    metronomeRef.current?.setBpm(bpm);
  }, [setMetronomeBpm]);

  return { toggle, setBpm, isPlaying: metronome.isPlaying, bpm: metronome.bpm, currentBeat: metronome.currentBeat };
}

// ── useStringVibration hook ────────────────────────────────
export function useStringVibration(stringIndex: number) {
  const setStringVibrating = useGuitarStore((s) => s.setStringVibrating);
  const updateStringDecay = useGuitarStore((s) => s.updateStringDecay);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const decayRateRef = useRef<number>(0);

  const trigger = useCallback((amplitude: number, decaySeconds = 2.5) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimeRef.current = performance.now();
    decayRateRef.current = 1 / (decaySeconds * 1000);

    setStringVibrating(stringIndex, amplitude);

    const animate = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const decay = Math.min(1, elapsed * decayRateRef.current);
      const currentAmp = amplitude * (1 - decay);
      updateStringDecay(stringIndex, decay);
      if (decay < 0.99) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setStringVibrating(stringIndex, 0);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [stringIndex, setStringVibrating, updateStringDecay]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStringVibrating(stringIndex, 0);
    updateStringDecay(stringIndex, 1);
  }, [stringIndex, setStringVibrating, updateStringDecay]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return { trigger, stop };
}
