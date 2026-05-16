'use client';

// ─────────────────────────────────────────────────────────
//  Metronome — scheduler-based, Web Audio lookahead
//  Eliminates JS timer drift for precise timing
// ─────────────────────────────────────────────────────────

type BeatCallback = (beat: number, time: number, isAccent: boolean) => void;

export class Metronome {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private bpm = 80;
  private timeSignature: [number, number] = [4, 4];
  private currentBeat = 0;
  private nextBeatTime = 0;
  private lookahead = 0.1;       // seconds ahead to schedule
  private scheduleInterval = 25; // ms between scheduler runs
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private onBeat: BeatCallback | null = null;
  private accentFirst = true;

  constructor(private audioCtx?: AudioContext) {}

  private async _ensureCtx(): Promise<void> {
    if (!this.ctx) {
      this.ctx = this.audioCtx ?? new AudioContext({ latencyHint: 'interactive' });
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  private _secondsPerBeat(): number {
    return 60 / this.bpm;
  }

  private _scheduleNextBeats(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const lookaheadTime = now + this.lookahead;

    while (this.nextBeatTime < lookaheadTime) {
      const beatNum = (this.currentBeat % this.timeSignature[0]) + 1;
      const isAccent = this.accentFirst && beatNum === 1;

      // Schedule click sound
      this._scheduleClick(this.nextBeatTime, isAccent);

      // Notify callback (with slight lead for UI sync)
      const capturedBeat = beatNum;
      const capturedTime = this.nextBeatTime;
      setTimeout(() => {
        this.onBeat?.(capturedBeat, capturedTime, isAccent);
      }, Math.max(0, (capturedTime - (this.ctx?.currentTime ?? 0)) * 1000 - 5));

      this.currentBeat++;
      this.nextBeatTime += this._secondsPerBeat();
    }
  }

  private _scheduleClick(when: number, accent: boolean): void {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = accent ? 1600 : 1000;

    gain.gain.setValueAtTime(accent ? 0.7 : 0.45, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(when);
    osc.stop(when + 0.05);
  }

  async start(onBeat: BeatCallback): Promise<void> {
    if (this.isRunning) return;
    await this._ensureCtx();
    this.onBeat = onBeat;
    this.isRunning = true;
    this.currentBeat = 0;
    this.nextBeatTime = this.ctx!.currentTime + 0.05;
    this.schedulerTimer = setInterval(() => this._scheduleNextBeats(), this.scheduleInterval);
    this._scheduleNextBeats();
  }

  stop(): void {
    this.isRunning = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.onBeat = null;
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
  }

  setTimeSignature(ts: [number, number]): void {
    this.timeSignature = ts;
  }

  setAccentFirst(accent: boolean): void {
    this.accentFirst = accent;
  }

  getBpm(): number { return this.bpm; }
  getIsRunning(): boolean { return this.isRunning; }

  setAudioContext(ctx: AudioContext): void {
    this.ctx = ctx;
  }
}
