'use client';

import type { AudioNote, AudioEngineState } from '@/types';

const OPEN_STRING_FREQS: number[] = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
const SEMITONE = Math.pow(2, 1 / 12);

function fretToFreq(stringIdx: number, fret: number): number {
  return OPEN_STRING_FREQS[stringIdx] * Math.pow(SEMITONE, fret);
}

interface StringSynthState {
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  activeBufferSources: AudioBufferSourceNode[];
  lastPlayTime: number;
}

export class GuitarAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private strings: Map<number, StringSynthState> = new Map();
  private initialized = false;
  private state: AudioEngineState = { initialized: false, latency: 0, sampleRate: 44100, bufferSize: 256 };

  async init(): Promise<void> {
    if (this.initialized) return;
    this.ctx = new AudioContext({ latencyHint: 'interactive', sampleRate: 44100 });
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.state.sampleRate = this.ctx.sampleRate;
    this.state.latency = (this.ctx.baseLatency + this.ctx.outputLatency) * 1000;
    await this._buildSignalChain();
    this._initStrings();
    this.initialized = true;
    this.state.initialized = true;
  }

  private async _buildSignalChain(): Promise<void> {
    if (!this.ctx) return;
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 8;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.15;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.75;
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.25;
    this.reverbNode = await this._createReverb(1.8, 2.5);
    this.compressor.connect(this.dryGain);
    this.compressor.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);
    this.dryGain.connect(this.masterGain);
    this.reverbGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  private async _createReverb(duration: number, decay: number): Promise<ConvolverNode> {
    if (!this.ctx) throw new Error('No audio context');
    const convolver = this.ctx.createConvolver();
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }

  private _initStrings(): void {
    if (!this.ctx || !this.compressor) return;
    for (let s = 0; s < 6; s++) {
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0;
      const filterNode = this.ctx.createBiquadFilter();
      filterNode.type = 'peaking';
      filterNode.frequency.value = 1200 + s * 400;
      filterNode.Q.value = 1.2;
      filterNode.gain.value = s < 3 ? 2 : -1;
      gainNode.connect(filterNode);
      filterNode.connect(this.compressor);
      this.strings.set(s, { gainNode, filterNode, activeBufferSources: [], lastPlayTime: 0 });
    }
  }

  private _synthesizeString(stringIdx: number, fret: number, velocity: number, when: number): void {
    if (!this.ctx) return;
    const strState = this.strings.get(stringIdx);
    if (!strState) return;
    const freq = fretToFreq(stringIdx, fret);
    const sampleRate = this.ctx.sampleRate;
    const bufferLength = Math.max(Math.round(sampleRate / freq) * 2, 512);
    const noiseBuffer = this.ctx.createBuffer(1, bufferLength, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferLength; i++) {
      const t = i / bufferLength;
      const attack = Math.min(1, t * 20);
      const decay = Math.exp(-t * 3);
      const harmonic = Math.sin(2 * Math.PI * i * freq / sampleRate);
      const noise = Math.random() * 2 - 1;
      data[i] = (noise * (1 - velocity * 0.4) + harmonic * velocity * 0.4) * attack * decay;
    }
    const bufSource = this.ctx.createBufferSource();
    bufSource.buffer = noiseBuffer;
    const delay = this.ctx.createDelay(0.1);
    delay.delayTime.value = 1 / freq;
    const ksFilter = this.ctx.createBiquadFilter();
    ksFilter.type = 'lowpass';
    ksFilter.frequency.value = 800 + velocity * 3200;
    ksFilter.Q.value = 0.5;
    const feedbackGain = this.ctx.createGain();
    feedbackGain.gain.value = Math.min(0.965 + (5 - stringIdx) * 0.004 + velocity * 0.01, 0.998);
    const noteGain = this.ctx.createGain();
    const amp = 0.15 + Math.pow(velocity, 0.7) * 0.6;
    noteGain.gain.setValueAtTime(amp, when);
    noteGain.gain.setTargetAtTime(0, when + 0.05, 1.5 + (5 - stringIdx) * 0.3);
    bufSource.connect(delay);
    delay.connect(ksFilter);
    ksFilter.connect(feedbackGain);
    feedbackGain.connect(delay);
    feedbackGain.connect(noteGain);
    noteGain.connect(strState.gainNode);
    strState.gainNode.gain.cancelScheduledValues(when);
    strState.gainNode.gain.setValueAtTime(1, when);
    bufSource.start(when);
    bufSource.stop(when + 4 + (5 - stringIdx) * 0.5);
    strState.activeBufferSources.push(bufSource);
    strState.lastPlayTime = when;
    bufSource.onended = () => {
      const idx = strState.activeBufferSources.indexOf(bufSource);
      if (idx !== -1) strState.activeBufferSources.splice(idx, 1);
    };
  }

  async ensureRunning(): Promise<void> {
    if (!this.initialized) await this.init();
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  pluck(note: AudioNote): void {
    if (!this.ctx || !this.initialized) return;
    this._synthesizeString(note.string, note.fret, Math.min(1, note.velocity), this.ctx.currentTime + 0.001);
  }

  strum(notes: AudioNote[], direction: 'down' | 'up' = 'down'): void {
    if (!this.ctx || !this.initialized) return;
    const now = this.ctx.currentTime;
    const spread = 0.007;
    notes.forEach((note, i) => {
      const order = direction === 'down' ? i : notes.length - 1 - i;
      this._synthesizeString(note.string, note.fret, Math.min(1, note.velocity), now + order * spread + 0.001);
    });
  }

  muteString(stringIdx: number): void {
    const strState = this.strings.get(stringIdx);
    if (!strState || !this.ctx) return;
    strState.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.015);
  }

  muteAll(): void {
    for (let s = 0; s < 6; s++) this.muteString(s);
  }

  setMasterVolume(vol: number): void {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.02);
  }

  setReverbAmount(amount: number): void {
    if (!this.reverbGain || !this.dryGain || !this.ctx) return;
    const wet = Math.max(0, Math.min(1, amount));
    this.reverbGain.gain.setTargetAtTime(wet * 0.4, this.ctx.currentTime, 0.05);
    this.dryGain.gain.setTargetAtTime(0.6 + wet * 0.1, this.ctx.currentTime, 0.05);
  }

  getState(): AudioEngineState { return { ...this.state }; }

  getLatency(): number {
    if (!this.ctx) return 0;
    return (this.ctx.baseLatency + this.ctx.outputLatency) * 1000;
  }

  destroy(): void {
    this.muteAll();
    setTimeout(() => this.ctx?.close(), 200);
    this.initialized = false;
    this.state.initialized = false;
  }
}

let engineInstance: GuitarAudioEngine | null = null;

export function getAudioEngine(): GuitarAudioEngine {
  if (!engineInstance) engineInstance = new GuitarAudioEngine();
  return engineInstance;
}
