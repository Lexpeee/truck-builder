"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { OrbitControls } from "three-stdlib";

/**
 * Drives a `frameloop="never"` canvas: renders only when something asked for
 * a frame, and never more often than `fps`. Everything that normally calls
 * `invalidate` (prop changes, OrbitControls) lands here, so idle stays at 0
 * frames. `active` false holds the pending frame until it turns true.
 */
export function RenderGate({ fps, active = true }: { fps: number; active?: boolean }) {
  const get = useThree((s) => s.get);
  const set = useThree((s) => s.set);
  const advance = useThree((s) => s.advance);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const original = get().invalidate;
    // rAF fires on vsync, so allow 1 ms of jitter below the nominal interval.
    const interval = 1000 / fps - 1;
    let dirty = true;
    let last = -Infinity;
    let raf = 0;

    const tick = (t: number) => {
      raf = 0;
      if (!dirty || !active) return;
      if (t - last < interval) {
        raf = requestAnimationFrame(tick);
        return;
      }
      last = t;
      dirty = false;
      // A useFrame or control that invalidates during this frame calls request().
      advance(t);
    };
    const request = () => {
      dirty = true;
      if (!raf && active) raf = requestAnimationFrame(tick);
    };

    set({ invalidate: request });
    request();
    return () => {
      cancelAnimationFrame(raf);
      set({ invalidate: original });
    };
  }, [get, set, advance, fps, active]);

  // Resizes bypass `invalidate`, and the drawing buffer is cleared by them.
  useEffect(() => get().invalidate(), [get, size, gl]);
  return null;
}

/**
 * While `enabled`, requests a frame every 1/`fps` s and reports the elapsed
 * seconds, so auto-rotate advances at a fixed rate without driving the loop.
 */
export function FrameCap({
  enabled,
  fps,
  onTick,
}: {
  enabled: boolean;
  fps: number;
  onTick?: (dt: number) => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!enabled) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      onTick?.((now - last) / 1000);
      last = now;
      invalidate();
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [enabled, fps, onTick, invalidate]);
  return null;
}

const DAMPING_PER_FRAME_AT_60 = 0.05;

/**
 * three's damping is applied per update, so it decays twice as fast in real
 * time at 30 fps. Rescale the factor by the elapsed time to keep the feel.
 */
export function FrameRateIndependentDamping() {
  useFrame(({ controls }, delta) => {
    const c = controls as OrbitControls | null;
    if (!c) return;
    // The first frame after idle sees a long gap; don't let it fling the model.
    const frames = Math.min(delta, 0.05) * 60;
    c.dampingFactor = 1 - Math.pow(1 - DAMPING_PER_FRAME_AT_60, frames);
  }, -2);
  return null;
}
