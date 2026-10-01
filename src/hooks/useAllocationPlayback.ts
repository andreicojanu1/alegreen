import { useEffect, useMemo, useRef, useState } from 'react';
import type { AllocationResult } from '../engine/types';
import { buildTimeline, viewAt, type PlaybackView, type TimelineStep } from '../lib/allocationTimeline';

export const SPEEDS = [0.5, 1, 2, 4] as const;
const STEP_MS = 650; // durata unui pas la viteza 1×

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export interface Playback {
  view: PlaybackView;
  steps: TimelineStep[];
  t: number;
  playing: boolean;
  speed: number;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  replay: () => void;
  setSpeed: (s: number) => void;
}

/** Redarea animată a unei rulări. Cu prefers-reduced-motion (sau autoplay=false) pornește direct de la rezultat. */
export function useAllocationPlayback(result: AllocationResult, autoplay: boolean): Playback {
  const steps = useMemo(() => buildTimeline(result), [result]);
  const animate = autoplay && !prefersReducedMotion();
  const [t, setT] = useState(animate ? 0 : steps.length);
  const [playing, setPlaying] = useState(animate);
  const [speed, setSpeed] = useState(1);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = Math.min(steps.length, tRef.current + ((now - last) / STEP_MS) * speed);
      last = now;
      setT(next);
      if (next >= steps.length) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, steps.length]);

  const view = useMemo(() => viewAt(steps, t), [steps, t]);
  return {
    view,
    steps,
    t,
    playing,
    speed,
    pause: () => setPlaying(false),
    resume: () => t < steps.length && setPlaying(true),
    skip: () => {
      setPlaying(false);
      setT(steps.length);
    },
    replay: () => {
      if (prefersReducedMotion()) return setT(steps.length);
      setT(0);
      setPlaying(true);
    },
    setSpeed,
  };
}
