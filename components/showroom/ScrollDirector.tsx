"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Explosion } from "./ExplodedParts";

/** One still of the scroll story: where the truck, camera and parts are. */
export type Pose = {
  /** Turntable angle of the truck, radians. */
  spin: number;
  /** Camera distance from the look-at point, metres, for a wide viewport. */
  dist: number;
  /** Camera elevation above the horizon, radians. */
  elev: number;
  /** Height of the look-at point, metres. */
  ty: number;
  /** Wide viewports: sideways offset of the truck on screen, as a fraction of the width (+ right). */
  shift: number;
  /** Narrow viewports: vertical offset of the truck on screen, as a fraction of the height (+ up). */
  lift: number;
  /** Parts separated: 0 assembled, 1 fully exploded. */
  explode: number;
};

export type ScrollStory = {
  /** Tall element; progress is how far the viewport has travelled through it. */
  track: HTMLElement;
  pose: (progress: number) => Pose;
  /** Called with the smoothed progress whenever it changes. */
  onProgress?: (progress: number) => void;
};

/** Camera azimuth; the truck turns on the turntable instead. */
const AZIMUTH = Math.PI / 4;
/** Narrowest aspect ratio at which the whole truck fits at a pose's distance. */
const FIT_ASPECT = 1.5;
/** Below this width/height ratio the text is under the truck, not beside it (see `shift`, `lift`). */
const SHIFT_MIN_ASPECT = 1.3;
/** Seconds-ish: how quickly the scene catches up with the scroll position. */
const CATCH_UP = 9;

const _target = new THREE.Vector3();

/**
 * Plays the scene from the page's scroll position, like scrubbing a video:
 * the same scroll position always shows the same frame. Draws frames only while
 * scrolling or catching up, so an idle page costs nothing.
 */
export function ScrollDirector({
  story,
  spin,
  explosion,
  reduced,
}: {
  story: ScrollStory;
  spin: { setAngle: (radians: number) => void };
  explosion: Explosion;
  reduced: boolean;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const goal = useRef(0);
  const shown = useRef(-1);
  const clock = useRef(0);

  useEffect(() => {
    const read = () => {
      const r = story.track.getBoundingClientRect();
      const range = r.height - window.innerHeight;
      goal.current = range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
      invalidate();
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [story.track, invalidate]);

  useFrame(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - clock.current) / 1000);
    clock.current = now;
    const first = shown.current < 0;
    const gap = goal.current - (first ? goal.current : shown.current);
    // Reduced motion: no catching up, the scene follows the scroll exactly.
    const settled = first || reduced || Math.abs(gap) < 1e-4;
    shown.current = settled ? goal.current : shown.current + gap * (1 - Math.exp(-CATCH_UP * dt));
    if (!settled) invalidate();

    const p = shown.current;
    const pose = story.pose(p);
    const aspect = size.width / size.height;
    // The camera's field of view is vertical: pull back on narrow viewports.
    const dist = pose.dist * Math.max(1, FIT_ASPECT / aspect);
    spin.setAngle(pose.spin);
    explosion.scrub(pose.explode);

    _target.set(0, pose.ty, 0);
    camera.position
      .setFromSphericalCoords(dist, Math.PI / 2 - pose.elev, AZIMUTH)
      .add(_target);
    camera.lookAt(_target);
    // Make room for the text: beside the truck on wide viewports, below it on narrow
    // ones, blending in between so a resize never snaps.
    const room = Math.min(1, Math.max(0, (aspect - SHIFT_MIN_ASPECT) / 0.15));
    const dx = -pose.shift * room * size.width;
    const dy = pose.lift * (1 - room) * size.height;
    if (dx || dy) camera.setViewOffset(size.width, size.height, dx, dy, size.width, size.height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    story.onProgress?.(p);
  }, -3);
  return null;
}
