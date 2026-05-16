'use client';

import type { TouchPoint, SwipeGesture, GestureType, GestureEvent } from '@/types';

// ─────────────────────────────────────────────────────────
//  TouchEngine — ultra-low latency multi-touch handler
//  Detects: pluck, strum-up, strum-down, mute, hold, slide
// ─────────────────────────────────────────────────────────

const SWIPE_THRESHOLD_PX = 12;
const HOLD_THRESHOLD_MS = 180;
const VELOCITY_HISTORY_MS = 80;

interface ActiveTouch {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  history: Array<{ x: number; y: number; t: number }>;
  isHold: boolean;
  holdTimer: ReturnType<typeof setTimeout> | null;
  lastVelocityX: number;
  lastVelocityY: number;
}

type GestureCallback = (event: GestureEvent) => void;
type StringHitCallback = (stringIndex: number, x: number, y: number, force: number) => void;

export class TouchEngine {
  private element: HTMLElement | null = null;
  private activeTouches: Map<number, ActiveTouch> = new Map();
  private onGesture: GestureCallback | null = null;
  private onStringHit: StringHitCallback | null = null;

  // String zones — set dynamically from layout
  private stringZones: Array<{ top: number; bottom: number; index: number }> = [];

  private _listeners: Array<[string, EventListener]> = [];

  // ── Attach to DOM element ──────────────────────────────
  attach(
    el: HTMLElement,
    onGesture: GestureCallback,
    onStringHit?: StringHitCallback
  ): void {
    this.element = el;
    this.onGesture = onGesture;
    this.onStringHit = onStringHit ?? null;

    const opts: AddEventListenerOptions = { passive: false, capture: false };

    const onStart = (e: Event) => this._onTouchStart(e as TouchEvent);
    const onMove = (e: Event) => this._onTouchMove(e as TouchEvent);
    const onEnd = (e: Event) => this._onTouchEnd(e as TouchEvent);
    const onCancel = (e: Event) => this._onTouchCancel(e as TouchEvent);

    el.addEventListener('touchstart', onStart, opts);
    el.addEventListener('touchmove', onMove, opts);
    el.addEventListener('touchend', onEnd, opts);
    el.addEventListener('touchcancel', onCancel, opts);

    // Mouse fallback for desktop
    el.addEventListener('mousedown', (e: Event) => this._onMouseDown(e as MouseEvent), opts);
    el.addEventListener('mousemove', (e: Event) => this._onMouseMove(e as MouseEvent), opts);
    el.addEventListener('mouseup', (e: Event) => this._onMouseUp(e as MouseEvent), opts);

    this._listeners = [
      ['touchstart', onStart as EventListener],
      ['touchmove', onMove as EventListener],
      ['touchend', onEnd as EventListener],
      ['touchcancel', onCancel as EventListener],
    ];
  }

  setStringZones(zones: Array<{ top: number; bottom: number; index: number }>): void {
    this.stringZones = zones;
  }

  private _getStringAtY(y: number): number {
    for (const zone of this.stringZones) {
      if (y >= zone.top && y <= zone.bottom) return zone.index;
    }
    return -1;
  }

  // ── Touch Start ────────────────────────────────────────
  private _onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.element!.getBoundingClientRect();
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      const force = t.force ?? 0.5;

      const activeTouch: ActiveTouch = {
        id: t.identifier,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        startTime: now,
        history: [{ x, y, t: now }],
        isHold: false,
        holdTimer: null,
        lastVelocityX: 0,
        lastVelocityY: 0,
      };

      activeTouch.holdTimer = setTimeout(() => {
        activeTouch.isHold = true;
        this._emit({ type: 'hold', velocity: force, timestamp: performance.now() });
      }, HOLD_THRESHOLD_MS);

      this.activeTouches.set(t.identifier, activeTouch);

      const stringIndex = this._getStringAtY(y);
      if (stringIndex >= 0) {
        this.onStringHit?.(stringIndex, x, y, force);
      }
    }
  }

  // ── Touch Move ─────────────────────────────────────────
  private _onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.element!.getBoundingClientRect();
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const touch = this.activeTouches.get(t.identifier);
      if (!touch) continue;

      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;

      touch.currentX = x;
      touch.currentY = y;
      touch.history.push({ x, y, t: now });

      // Prune old history
      const cutoff = now - VELOCITY_HISTORY_MS;
      while (touch.history.length > 1 && touch.history[0].t < cutoff) {
        touch.history.shift();
      }

      // If significant movement detected, cancel hold
      const dx = x - touch.startX;
      const dy = y - touch.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > SWIPE_THRESHOLD_PX && touch.holdTimer) {
        clearTimeout(touch.holdTimer);
        touch.holdTimer = null;
      }
    }
  }

  // ── Touch End ──────────────────────────────────────────
  private _onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.element!.getBoundingClientRect();
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const touch = this.activeTouches.get(t.identifier);
      if (!touch) continue;

      if (touch.holdTimer) {
        clearTimeout(touch.holdTimer);
        touch.holdTimer = null;
      }

      const endX = t.clientX - rect.left;
      const endY = t.clientY - rect.top;
      const dx = endX - touch.startX;
      const dy = endY - touch.startY;
      const duration = now - touch.startTime;

      const gesture = this._computeGesture(touch, endX, endY, duration);
      if (gesture) this._emit(gesture);

      this.activeTouches.delete(t.identifier);
    }
  }

  private _onTouchCancel(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = this.activeTouches.get(e.changedTouches[i].identifier);
      if (touch?.holdTimer) clearTimeout(touch.holdTimer);
      this.activeTouches.delete(e.changedTouches[i].identifier);
    }
  }

  // ── Mouse Fallback ─────────────────────────────────────
  private _mouseDown = false;
  private _mouseTouch: ActiveTouch | null = null;

  private _onMouseDown(e: MouseEvent): void {
    if (!this.element) return;
    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    this._mouseDown = true;
    this._mouseTouch = {
      id: -1,
      startX: x, startY: y,
      currentX: x, currentY: y,
      startTime: now,
      history: [{ x, y, t: now }],
      isHold: false,
      holdTimer: null,
      lastVelocityX: 0, lastVelocityY: 0,
    };
    const stringIndex = this._getStringAtY(y);
    if (stringIndex >= 0) this.onStringHit?.(stringIndex, x, y, 0.6);
  }

  private _onMouseMove(e: MouseEvent): void {
    if (!this._mouseDown || !this._mouseTouch || !this.element) return;
    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    this._mouseTouch.currentX = x;
    this._mouseTouch.currentY = y;
    this._mouseTouch.history.push({ x, y, t: now });
  }

  private _onMouseUp(e: MouseEvent): void {
    if (!this._mouseDown || !this._mouseTouch || !this.element) return;
    const rect = this.element.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const duration = performance.now() - this._mouseTouch.startTime;
    const gesture = this._computeGesture(this._mouseTouch, endX, endY, duration);
    if (gesture) this._emit(gesture);
    this._mouseDown = false;
    this._mouseTouch = null;
  }

  // ── Gesture Computation ────────────────────────────────
  private _computeGesture(
    touch: ActiveTouch,
    endX: number,
    endY: number,
    duration: number
  ): GestureEvent | null {
    const dx = endX - touch.startX;
    const dy = endY - touch.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Compute velocity from recent history
    let velocity = 0;
    let velocityX = 0;
    let velocityY = 0;

    if (touch.history.length >= 2) {
      const first = touch.history[0];
      const last = touch.history[touch.history.length - 1];
      const dt = (last.t - first.t) / 1000; // seconds
      if (dt > 0) {
        velocityX = (last.x - first.x) / dt;
        velocityY = (last.y - first.y) / dt;
        velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      }
    }

    // Normalize velocity to 0–1 (cap at 3000 px/s)
    const normalizedVelocity = Math.min(1, velocity / 3000);

    // Short tap = pluck
    if (dist < SWIPE_THRESHOLD_PX && duration < 300) {
      return { type: 'pluck', velocity: Math.max(0.3, normalizedVelocity), timestamp: performance.now() };
    }

    // Determine strum direction from Y axis
    if (Math.abs(dy) > SWIPE_THRESHOLD_PX) {
      const type: GestureType = dy > 0 ? 'strum-down' : 'strum-up';
      const swipe: SwipeGesture = {
        startX: touch.startX, startY: touch.startY,
        endX, endY,
        velocityX, velocityY,
        velocity,
        direction: dy > 0 ? 'down' : 'up',
        duration,
        force: normalizedVelocity,
      };
      return { type, velocity: Math.max(0.2, normalizedVelocity), timestamp: performance.now(), swipe };
    }

    // Horizontal slide
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      return { type: 'slide', velocity: normalizedVelocity, timestamp: performance.now() };
    }

    return null;
  }

  private _emit(event: GestureEvent): void {
    this.onGesture?.(event);
  }

  detach(): void {
    if (!this.element) return;
    for (const [type, fn] of this._listeners) {
      this.element.removeEventListener(type, fn);
    }
    this._listeners = [];
    this.element = null;
    this.activeTouches.clear();
  }
}
