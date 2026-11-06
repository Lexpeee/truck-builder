import { PAINT_COLORS, PAINT_MATERIAL, type PaintColorId } from "@/lib/paint";
import type { Pose } from "../showroom/ScrollDirector";
import { HERO_BUILD } from "../showroom/scene-config";

/**
 * The scroll story's timeline. Scroll progress (0 at the top of the story,
 * 1 at its end) maps to a pose of the 3D scene, like frames of a video.
 * One beat per chapter in ScrollStory: beat i is the pose while chapter i is
 * on screen, and the scene eases between neighbouring beats.
 */
export type Beat = Pose & {
  /** Position on the timeline, 0–1. */
  at: number;
};

const beat = (at: number, pose: Pose): Beat => ({ at, ...pose });

export const BEATS: Beat[] = [
  // Hero: the whole truck, front three-quarter, as in the old hero.
  beat(0, { spin: -2.7, dist: 15, elev: 0.33, ty: 1.2, shift: 0.2, lift: -0.2, explode: 0 }),
  // Chassis: push in on the cab, truck to the left.
  beat(0.2, { spin: -3.3, dist: 9.5, elev: 0.2, ty: 1.5, shift: -0.2, lift: 0.2, explode: 0 }),
  // Upfits lift away, camera pulls back and swings to the side.
  beat(0.4, { spin: -4.2, dist: 17, elev: 0.4, ty: 1.5, shift: 0.2, lift: 0.2, explode: 1 }),
  // Held apart while the camera climbs over the top and around the back.
  beat(0.6, { spin: -5.8, dist: 18, elev: 0.62, ty: 1.4, shift: -0.2, lift: 0.2, explode: 1 }),
  // Back together, repainting.
  beat(0.8, { spin: -7.0, dist: 11.5, elev: 0.28, ty: 1.2, shift: 0.2, lift: 0.2, explode: 0 }),
  // Finished truck, front three-quarter again, centred for the call to action.
  beat(1, { spin: -2.7 - 2 * Math.PI, dist: 13.5, elev: 0.3, ty: 2.5, shift: 0, lift: 0.2, explode: 0 }),
];

/** Truck colour as the story repaints it; the first entry is the hero's. */
const PAINT_STEPS: { from: number; id: PaintColorId }[] = [
  { from: 0, id: "white" },
  { from: 0.66, id: "safety-orange" },
  { from: 0.73, id: "charcoal" },
  { from: 0.8, id: "nwt-blue" },
];

const smooth = (k: number) => k * k * (3 - 2 * k);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** The pose at `progress`: each pair of beats eased, so the scene settles on every beat. */
export function samplePose(progress: number): Pose {
  const p = Math.min(1, Math.max(0, progress));
  let i = 0;
  while (i < BEATS.length - 2 && p > BEATS[i + 1].at) i++;
  const a = BEATS[i];
  const b = BEATS[i + 1];
  const k = smooth(Math.min(1, Math.max(0, (p - a.at) / (b.at - a.at))));
  return {
    spin: lerp(a.spin, b.spin, k),
    dist: lerp(a.dist, b.dist, k),
    elev: lerp(a.elev, b.elev, k),
    ty: lerp(a.ty, b.ty, k),
    shift: lerp(a.shift, b.shift, k),
    lift: lerp(a.lift, b.lift, k),
    explode: lerp(a.explode, b.explode, k),
  };
}

export function paintAt(progress: number): PaintColorId {
  let id = PAINT_STEPS[0].id;
  for (const s of PAINT_STEPS) if (progress >= s.from) id = s.id;
  return id;
}

/** The hero build's paint materials set to one colour, in the scene's `partColors` shape. */
export function heroColors(id: PaintColorId): Record<string, Record<string, string>> {
  const hex = PAINT_COLORS.find((c) => c.id === id)!.hex;
  const colors: Record<string, Record<string, string>> = {
    [HERO_BUILD.vehicleId]: { [PAINT_MATERIAL.vehicle]: hex },
  };
  // Bumpers are unpainted; the body and rack follow the vehicle.
  for (const upfit of HERO_BUILD.upfitIds) {
    if (!upfit.includes("bumper")) colors[upfit] = { [PAINT_MATERIAL.upfit]: hex };
  }
  return colors;
}
