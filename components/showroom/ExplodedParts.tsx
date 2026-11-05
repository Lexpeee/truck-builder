"use client";
import { EXPLODE_TIMING, type ExplodePart } from "@/lib/explode";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";

export const easeInOut = (k: number) =>
  k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

/**
 * Explode progress per part (0 mounted, 1 exploded), mutated outside React's
 * render like the turntable's Spin. Progress is stepped by wall-clock time:
 * R3F's frame delta is not in seconds under RenderGate.
 */
export class Explosion {
  exploded = false;
  parts: ExplodePart[] = [];
  /** Mounted (unexploded) bounds per part id, for lines, labels and framing. */
  boxes = new Map<string, THREE.Box3>();
  private progress = new Map<string, number>();
  private startAt = new Map<string, number>();
  private last = 0;
  private changed = false;

  setParts(parts: ExplodePart[]) {
    this.parts = parts;
  }

  /** Start separating (true) or reassembling (false) from wherever each part is now. */
  toggle(exploded: boolean, now: number, reduced: boolean) {
    this.exploded = exploded;
    this.changed = true;
    this.last = now;
    const moving = this.parts.filter((p) => p.rank >= 0);
    for (const p of moving) {
      // Separate in order; put back in reverse.
      const slot = exploded ? p.rank : moving.length - 1 - p.rank;
      this.startAt.set(p.id, now + slot * EXPLODE_TIMING.staggerMs);
      if (reduced) this.progress.set(p.id, this.target);
    }
  }

  private get target() {
    return this.exploded ? 1 : 0;
  }

  /** A part seen for the first time starts where the others are heading, e.g. one added while exploded. */
  raw(id: string) {
    return this.progress.get(id) ?? this.target;
  }

  eased(id: string) {
    return easeInOut(this.raw(id));
  }

  /** Advance to `now`. True while any part is still moving. */
  step(now: number) {
    const dt = now - this.last;
    this.last = now;
    let moving = false;
    for (const p of this.parts) {
      if (p.rank < 0) continue;
      const cur = this.raw(p.id);
      if (cur === this.target) continue;
      moving = true;
      const active = Math.min(dt, now - (this.startAt.get(p.id) ?? 0));
      if (active <= 0) continue;
      const delta = active / EXPLODE_TIMING.durationMs;
      this.progress.set(
        p.id,
        this.exploded ? Math.min(1, cur + delta) : Math.max(0, cur - delta),
      );
    }
    return moving;
  }

  /** True once after each toggle, when every part has arrived. */
  takeSettled(moving: boolean) {
    if (moving || !this.changed) return false;
    this.changed = false;
    return true;
  }

  /** Every part is at its exploded position. */
  get fullyExploded() {
    return this.exploded && this.parts.every((p) => p.rank < 0 || this.raw(p.id) === 1);
  }

  /** Total time from toggle to the last part arriving. */
  get durationMs() {
    const n = this.parts.filter((p) => p.rank >= 0).length;
    return EXPLODE_TIMING.durationMs + EXPLODE_TIMING.staggerMs * Math.max(0, n - 1);
  }
}

/**
 * Steps the explosion before anything else in the frame. Requests frames only
 * while parts move, so the canvas returns to on-demand rendering (0 idle frames).
 */
export function ExplodeDriver({
  explosion,
  onSettled,
}: {
  explosion: Explosion;
  onSettled: (exploded: boolean) => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  useFrame(() => {
    const moving = explosion.step(performance.now());
    if (moving) invalidate();
    if (explosion.takeSettled(moving)) onSettled(explosion.exploded);
  }, -3);
  return null;
}

/** Ignore tiny meshes (each upfit GLB has a 24-vertex marker cube at the origin). */
const MIN_MESH_SIZE = 0.1;

const _box = new THREE.Box3();
const _size = new THREE.Vector3();

/** Bounds of a part's meaningful meshes, in the truck group's space. */
function partBounds(root: THREE.Object3D) {
  const box = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    _box.makeEmpty().expandByObject(o);
    if (_box.getSize(_size).length() >= MIN_MESH_SIZE) box.union(_box);
  });
  return box;
}

/** Moves one part along its offset as the explosion progresses. */
export function ExplodeGroup({
  explosion,
  part,
  children,
}: {
  explosion: Explosion;
  part: ExplodePart;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const place = () => {
    const e = explosion.eased(part.id);
    ref.current!.position.set(part.offset[0] * e, part.offset[1] * e, part.offset[2] * e);
  };

  useLayoutEffect(() => {
    const g = ref.current!;
    // Measure mounted, then place: a part added while exploded never shows mounted.
    g.position.set(0, 0, 0);
    explosion.boxes.set(part.id, partBounds(g));
    place();
    return () => {
      explosion.boxes.delete(part.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explosion, part]);

  useFrame(place, -2);
  return <group ref={ref}>{children}</group>;
}
