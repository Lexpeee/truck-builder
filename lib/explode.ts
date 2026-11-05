import { getUpfit, getVehicle, type UpfitCategory } from "./catalog";

export type ExplodeRole = "chassis" | UpfitCategory;

type ExplodeEntry = {
  /**
   * Direction in the vehicle's own frame, [side, up, back]: side is the
   * passenger (right) side, back points from the cab toward the tailgate.
   * Normalized in code; converted to model space with the vehicle's `front`.
   */
  axis: [number, number, number];
  /** Metres moved when exploded. */
  distance: number;
  /** Lower moves first when separating, last when putting back. */
  order: number;
};

/** "Show parts" layout, one entry per part role. Tune here, never in components. */
export const EXPLODE: Record<ExplodeRole, ExplodeEntry> = {
  chassis: { axis: [0, 0, 0], distance: 0, order: 0 },
  rack: { axis: [0, 1, 0], distance: 1.2, order: 1 },
  body: { axis: [0, 1, 0.35], distance: 0.9, order: 2 },
  bumper: { axis: [0, 0, 1], distance: 0.8, order: 3 },
};

export const EXPLODE_TIMING = {
  /** Per part, ease-in-out. */
  durationMs: 800,
  /** Between consecutive parts. */
  staggerMs: 150,
  /** Reduced motion: no movement, just this cross-fade. */
  fadeMs: 200,
};

/**
 * Adding or removing an upfit: it slides along its explode direction. Shorter
 * than Show parts, since it happens on every pick.
 */
export const SLIDE_TIMING = {
  durationMs: 450,
  staggerMs: 120,
};

export type Vec3 = [number, number, number];

/**
 * Model-space offset for a part. `front` is the vehicle's facing direction as
 * [x, z] (lib/catalog.ts): RAM faces -Z, so its back is +Z; the Chevy faces +X.
 */
export function explodeOffset(role: ExplodeRole, front: [number, number]): Vec3 {
  const { axis, distance } = EXPLODE[role];
  const len = Math.hypot(...axis);
  if (!len || !distance) return [0, 0, 0];
  const [side, up, back] = axis.map((v) => (v / len) * distance);
  const [fx, fz] = front;
  // Right of a vehicle facing (fx, 0, fz) with +Y up is (-fz, 0, fx).
  return [side * -fz - back * fx, up, side * fx - back * fz];
}

export type ExplodePart = {
  /** Catalog id of the vehicle or upfit. */
  id: string;
  role: ExplodeRole;
  label: string;
  offset: Vec3;
  /** Position in the separating sequence among moving parts, from 0; -1 for parts that stay. */
  rank: number;
};

/** The build's parts with their explode offsets. Missing upfits are skipped; the rest keep their order. */
export function explodePlan(vehicleId: string, upfitIds: string[]): ExplodePart[] {
  const vehicle = getVehicle(vehicleId);
  if (!vehicle) return [];
  const parts = [
    { id: vehicle.id, role: "chassis" as ExplodeRole, label: vehicle.name },
    ...upfitIds
      .map(getUpfit)
      .filter((u) => u !== undefined)
      .map((u) => ({ id: u.id, role: u.category as ExplodeRole, label: u.name })),
  ].map((p) => ({ ...p, offset: explodeOffset(p.role, vehicle.front) }));
  const moving = parts
    .filter((p) => p.offset.some((v) => v !== 0))
    .sort((a, b) => EXPLODE[a.role].order - EXPLODE[b.role].order);
  return parts.map((p) => ({ ...p, rank: moving.indexOf(p) }));
}

/** A body goes first when arriving and last when leaving; racks and bumpers need it. */
const slideDepth = (id: string) => (getUpfit(id)?.requires?.length ? 1 : 0);

/**
 * Milliseconds after a build change at which each added upfit starts sliding
 * in and each removed one starts sliding out. Dependents arrive after the body
 * and leave before it; arrivals wait for departures, so a swapped bumper never
 * passes through the one it replaces.
 */
export function slideDelays(added: string[], removed: string[]) {
  const { durationMs, staggerMs } = SLIDE_TIMING;
  const leaveMs = removed.length ? durationMs + staggerMs : 0;
  return {
    enter: Object.fromEntries(added.map((id) => [id, leaveMs + slideDepth(id) * staggerMs])),
    leave: Object.fromEntries(removed.map((id) => [id, (1 - slideDepth(id)) * staggerMs])),
  };
}
