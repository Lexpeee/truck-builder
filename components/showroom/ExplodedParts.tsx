"use client";
import { EXPLODE_TIMING, type ExplodePart } from "@/lib/explode";
import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import type { Line2, LineMaterial, OrbitControls } from "three-stdlib";

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

/**
 * Each upfit GLB carries a small marker cube at the origin. Left in, it would
 * stretch a part's bounds to the origin (e.g. a rear bumper reaching the cab).
 */
const MARKER_MAX_SIZE = 0.3;

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();
const isOriginMarker = (b: THREE.Box3) =>
  b.getSize(_size).length() < MARKER_MAX_SIZE && b.getCenter(_center).length() < MARKER_MAX_SIZE;

/** Bounds of a part's meshes, without the origin marker, in the truck group's space. */
function partBounds(root: THREE.Object3D) {
  const box = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    _box.makeEmpty().expandByObject(o);
    if (!isOriginMarker(_box)) box.union(_box);
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

/**
 * Where a part meets the truck: its box centre pushed back against the
 * direction it moves (bottom for parts lifted up, front face for a bumper).
 */
export function mountAnchor(box: THREE.Box3, offset: readonly number[], out: THREE.Vector3) {
  const dir = _dir.fromArray(offset).normalize();
  const half = box.getSize(_size).multiplyScalar(0.5);
  const reach = Math.abs(dir.x) * half.x + Math.abs(dir.y) * half.y + Math.abs(dir.z) * half.z;
  return box.getCenter(out).addScaledVector(dir, -reach);
}

const _dir = new THREE.Vector3();
const _a = new THREE.Vector3();

const LINE = { color: "#8A93A1", width: 1.5, dash: 0.08, gap: 0.06 };
const PLACEHOLDER: [number, number, number][] = [
  [0, 0, 0],
  [0, 0.01, 0],
];

/** Dashed line from a part's mount to where it sits now; grows with the explosion and fades on the way back. */
function CenterLine({ explosion, part }: { explosion: Explosion; part: ExplodePart }) {
  const ref = useRef<Line2>(null);
  useFrame(() => {
    const line = ref.current!;
    const box = explosion.boxes.get(part.id);
    const e = explosion.eased(part.id);
    line.visible = !!box && e > 0.001;
    if (!line.visible) return;
    const a = mountAnchor(box!, part.offset, _a);
    const [ox, oy, oz] = part.offset;
    // Rewrite the one segment in place (no new GPU buffers per frame).
    const g = line.geometry;
    const pos = (g.attributes.instanceStart as THREE.InterleavedBufferAttribute).data;
    pos.array.set([a.x, a.y, a.z, a.x + ox * e, a.y + oy * e, a.z + oz * e]);
    pos.needsUpdate = true;
    const dist = (g.attributes.instanceDistanceStart as THREE.InterleavedBufferAttribute).data;
    dist.array[0] = 0;
    dist.array[1] = Math.hypot(ox, oy, oz) * e;
    dist.needsUpdate = true;
    (line.material as LineMaterial).opacity = e;
  }, -1);
  return (
    <Line
      ref={ref}
      points={PLACEHOLDER}
      color={LINE.color}
      lineWidth={LINE.width}
      dashed
      dashSize={LINE.dash}
      gapSize={LINE.gap}
      transparent
      depthWrite={false}
      frustumCulled={false}
      castShadow={false}
      receiveShadow={false}
      raycast={() => null}
    />
  );
}

/** One centerline per moving part. */
export function CenterLines({ explosion, plan }: { explosion: Explosion; plan: ExplodePart[] }) {
  return plan
    .filter((p) => p.rank >= 0)
    .map((p) => <CenterLine key={p.id} explosion={explosion} part={p} />);
}

/** DOM labels (no draw calls), positioned by ExplodeLabels. Hidden from screen readers: the live region announces. */
export function LabelOverlay({
  plan,
  overlayRef,
}: {
  plan: ExplodePart[];
  overlayRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={overlayRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {plan.map((p) => (
        <div
          key={p.id}
          data-part={p.id}
          style={{ display: "none" }}
          className="absolute top-0 left-0 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-base font-semibold whitespace-nowrap text-neutral-900 shadow-sm"
        >
          {p.label}
        </div>
      ))}
    </div>
  );
}

/** Canvas pixels covered by the camera toolbar along the top edge. */
export function toolbarInset(toolbar: HTMLElement | null, canvas: HTMLCanvasElement) {
  if (!toolbar) return 0;
  return Math.max(0, toolbar.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top);
}

const LABEL_GAP_PX = 8;
const _top = new THREE.Vector3();
const _ndc = new THREE.Vector3();

type Placed = { x: number; y: number; w: number; h: number };
const overlaps = (a: Placed, b: Placed) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Positions the labels once every part has arrived, on each rendered frame
 * (orbiting, resizing). Nearest labels win; any label that would overlap one
 * already placed, or leave the canvas, is hidden.
 */
export function ExplodeLabels({
  explosion,
  plan,
  front,
  overlayRef,
  toolbarRef,
}: {
  explosion: Explosion;
  plan: ExplodePart[];
  /** Vehicle facing [x, z]: the chassis label sits over the cab, clear of the body's. */
  front: [number, number];
  overlayRef: RefObject<HTMLDivElement | null>;
  /** Labels never sit under the camera toolbar. */
  toolbarRef: RefObject<HTMLElement | null>;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  useFrame(() => {
    const root = overlayRef.current;
    if (!root) return;
    const top = toolbarInset(toolbarRef.current, gl.domElement);
    const show = explosion.fullyExploded;
    const items: { el: HTMLElement; x: number; y: number; dist: number }[] = [];
    for (const p of plan) {
      const el = root.querySelector<HTMLElement>(`[data-part="${CSS.escape(p.id)}"]`);
      if (!el) continue;
      const box = explosion.boxes.get(p.id);
      el.style.display = "none";
      if (!show || !box) continue;
      // Top centre of the part where it sits now.
      box.getCenter(_top).setY(box.max.y);
      _top.x += p.offset[0];
      _top.y += p.offset[1];
      _top.z += p.offset[2];
      if (p.rank < 0) {
        const len = box.getSize(_size);
        _top.x += front[0] * len.x * 0.3;
        _top.z += front[1] * len.z * 0.3;
      }
      _ndc.copy(_top).project(camera);
      if (_ndc.z > 1) continue;
      items.push({
        el,
        x: ((_ndc.x + 1) / 2) * size.width,
        y: ((1 - _ndc.y) / 2) * size.height,
        dist: camera.position.distanceTo(_top),
      });
    }
    items.sort((a, b) => a.dist - b.dist);
    const placed: Placed[] = [];
    for (const it of items) {
      it.el.style.display = "block";
      const w = it.el.offsetWidth;
      const h = it.el.offsetHeight;
      const r = { x: it.x - w / 2, y: it.y - h - LABEL_GAP_PX, w, h };
      const inside = r.x >= 0 && r.y >= top && r.x + w <= size.width && r.y + h <= size.height;
      if (!inside || placed.some((q) => overlaps(q, r))) {
        it.el.style.display = "none";
        continue;
      }
      it.el.style.transform = `translate(${Math.round(r.x)}px, ${Math.round(r.y)}px)`;
      placed.push(r);
    }
  });
  return null;
}

const FIT_MARGIN = 1.1;
const _rel = new THREE.Vector3();
const _right = new THREE.Vector3();
const _upv = new THREE.Vector3();
const _back = new THREE.Vector3();
const _corner = new THREE.Vector3();

/**
 * Smallest camera distance from `target`, along `toCamera` (target to camera;
 * defaults to the current view), at which every exploded part fits the view
 * with a 10% margin.
 */
export function fitExplodedRadius(
  explosion: Explosion,
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  /** Share of the view's upper half left free by the toolbar (1 = all of it). */
  topFree = 1,
  toCamera?: THREE.Vector3,
) {
  if (toCamera) _back.copy(toCamera).normalize();
  else _back.subVectors(camera.position, target).normalize();
  _right.crossVectors(camera.up, _back).normalize();
  _upv.crossVectors(_back, _right);
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanH = tanV * camera.aspect;
  let need = 0;
  for (const p of explosion.parts) {
    const box = explosion.boxes.get(p.id);
    if (!box) continue;
    for (let i = 0; i < 8; i++) {
      _corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
      _corner.x += p.offset[0];
      _corner.y += p.offset[1];
      _corner.z += p.offset[2];
      _rel.subVectors(_corner, target);
      const along = _rel.dot(_back);
      const y = _rel.dot(_upv);
      need = Math.max(
        need,
        along + (FIT_MARGIN * Math.abs(_rel.dot(_right))) / tanH,
        along + (FIT_MARGIN * Math.abs(y)) / (tanV * (y > 0 ? topFree : 1)),
      );
    }
  }
  return need;
}

/**
 * Reframes the orbit camera with the explosion: pulls back (never in) to fit
 * the exploded parts, over the animation's length, and returns to the saved
 * distance on reassembly. Keeps the user's angle; never fights a drag.
 * `onFit` reports the distance zoom limits and view presets must allow.
 */
export function ExplodeCamera({
  explosion,
  exploded,
  reduced,
  onFit,
  assembledFit,
  toolbarRef,
}: {
  explosion: Explosion;
  exploded: boolean;
  reduced: boolean;
  onFit: (radius: number | null) => void;
  /** The orbit rig's assembled distance for an aspect ratio. */
  assembledFit: (aspect: number) => number;
  /** Parts are framed below the camera toolbar. */
  toolbarRef: RefObject<HTMLElement | null>;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as OrbitControls | null;
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const fitNow = () => {
    const topFree = 1 - (2 * toolbarInset(toolbarRef.current, gl.domElement)) / size.height;
    return fitExplodedRadius(explosion, camera, controls!.target, Math.max(0.2, topFree));
  };
  const dragging = useRef(false);
  const saved = useRef<number | null>(null);
  const tween = useRef<{ from: number; to: number; t0: number; ms: number; done?: () => void } | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!controls) return;
    const start = () => {
      dragging.current = true;
      tween.current = null; // the user takes over
    };
    const end = () => (dragging.current = false);
    controls.addEventListener("start", start);
    controls.addEventListener("end", end);
    return () => {
      controls.removeEventListener("start", start);
      controls.removeEventListener("end", end);
    };
  }, [controls]);

  useEffect(() => {
    if (!controls) return;
    if (first.current) {
      first.current = false;
      if (!exploded) return; // mounted assembled: nothing to frame
    }
    const current = camera.position.distanceTo(controls.target);
    const ms = reduced ? 0 : explosion.durationMs;
    if (exploded) {
      saved.current ??= current;
      const to = Math.max(current, fitNow());
      onFit(to);
      if (!dragging.current) tween.current = { from: current, to, t0: performance.now(), ms };
    } else {
      const to = saved.current ?? current;
      saved.current = null;
      // Lower the zoom limit only once the camera is back, so it never clamps mid-way.
      const done = () => onFit(null);
      if (dragging.current) done();
      else tween.current = { from: current, to, t0: performance.now(), ms, done };
    }
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exploded, controls]);

  // A resize resets the orbit rig to its assembled distance: refit while separated.
  const lastAspect = useRef(aspect);
  useEffect(() => {
    if (lastAspect.current === aspect) return;
    lastAspect.current = aspect;
    if (!controls || !explosion.exploded) return;
    tween.current = null;
    saved.current = assembledFit(aspect);
    const r = Math.max(saved.current, fitNow());
    onFit(r);
    _rel.subVectors(camera.position, controls.target).setLength(r);
    camera.position.copy(controls.target).add(_rel);
    controls.update();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, controls]);

  useFrame(() => {
    const tw = tween.current;
    if (!tw || !controls) return;
    const k = tw.ms ? Math.min(1, (performance.now() - tw.t0) / tw.ms) : 1;
    const r = tw.from + (tw.to - tw.from) * easeInOut(k);
    _rel.subVectors(camera.position, controls.target).setLength(r);
    camera.position.copy(controls.target).add(_rel);
    controls.update();
    if (k < 1) invalidate();
    else {
      tween.current = null;
      tw.done?.();
    }
  }, -1);
  return null;
}
