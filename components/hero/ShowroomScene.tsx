"use client";
import { getUpfit, getVehicle } from "@/lib/catalog";
import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  CAMERA,
  DISC,
  FILL_POSITION,
  HERO_BUILD,
  KEY_POSITION,
  MOTION,
  RIM_POSITION,
  SCENE_THEMES,
  SHADOW,
  type HeroTheme,
} from "./scene-config";

const TICK_COUNT = 36;

const defaultUrls = () =>
  [getVehicle(HERO_BUILD.vehicleId)!.fileName]
    .concat(HERO_BUILD.upfitIds.map((id) => getUpfit(id)!.fileName))
    .map((f) => `/models/${f}`);

type Props = {
  theme: HeroTheme;
  /** Optional GLB URL replacing the default catalog build. */
  model?: string;
  /** Narrow (<768px) layout: pulled-back camera and a smaller shadow map. */
  mobile: boolean;
  /** False pauses the render loop (off-screen or hidden tab). */
  active: boolean;
  /** Element that receives drag and arrow-key input. */
  inputTarget: HTMLElement | null;
  /** Poster rendering: hold the initial rotation. */
  still?: boolean;
  onReady: () => void;
};

/** Turntable angle plus the idle/auto-rotate rules. Mutated outside React's render. */
class Spin {
  angle = MOTION.initialRotation;
  private reduced = false;
  private lastInput = -Infinity;

  setReducedMotion(v: boolean) {
    this.reduced = v;
  }
  nudge(radians: number) {
    this.angle += radians;
    this.lastInput = performance.now();
  }
  hold() {
    this.lastInput = performance.now();
  }
  step(delta: number) {
    const idle = performance.now() - this.lastInput > MOTION.resumeAfterMs;
    if (!this.reduced && idle) this.angle += MOTION.autoRotate * Math.min(delta, 0.1);
  }
}

function CameraRig({ mobile }: { mobile: boolean }) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    const [x, y, z] = mobile ? CAMERA.mobile : CAMERA.desktop;
    camera.position.set(x, y, z);
    camera.lookAt(CAMERA.target[0], CAMERA.target[1], CAMERA.target[2]);
    camera.updateProjectionMatrix();
  }, [camera, mobile]);
  return null;
}

function Lights({ theme, mobile }: { theme: HeroTheme; mobile: boolean }) {
  const c = SCENE_THEMES[theme];
  const map = mobile ? SHADOW.mobileMap : SHADOW.desktopMap;
  return (
    <>
      <hemisphereLight args={[c.hemi.sky, c.hemi.ground, c.hemi.intensity]} />
      <directionalLight
        color={c.key.color}
        intensity={c.key.intensity}
        position={KEY_POSITION}
        castShadow
        shadow-mapSize={[map, map]}
        shadow-camera-left={-SHADOW.extent}
        shadow-camera-right={SHADOW.extent}
        shadow-camera-top={SHADOW.extent}
        shadow-camera-bottom={-SHADOW.extent}
        shadow-bias={SHADOW.bias}
      />
      <directionalLight color={c.rim.color} intensity={c.rim.intensity} position={RIM_POSITION} />
      <directionalLight color={c.fill.color} intensity={c.fill.intensity} position={FILL_POSITION} />
    </>
  );
}

function Turntable({ theme }: { theme: HeroTheme }) {
  const c = SCENE_THEMES[theme];
  return (
    <>
      <mesh position={[0, DISC.height / 2, 0]} receiveShadow>
        <cylinderGeometry args={[DISC.radius, DISC.radius, DISC.height, 96]} />
        <meshStandardMaterial {...c.disc} />
      </mesh>
      <mesh position={[0, DISC.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[DISC.radius - 0.05, 0.04, 12, 160]} />
        <meshStandardMaterial {...c.ring} />
      </mesh>
    </>
  );
}

function Ticks({ theme }: { theme: HeroTheme }) {
  const c = SCENE_THEMES[theme].tick;
  return (
    <>
      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const a = (i / TICK_COUNT) * Math.PI * 2;
        const r = DISC.radius - 0.35;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r, DISC.height + 0.005, Math.sin(a) * r]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[0.28, 0.01, 0.05]} />
            <meshStandardMaterial {...c} />
          </mesh>
        );
      })}
    </>
  );
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      for (const v of Object.values(m)) {
        if (v instanceof THREE.Texture) v.dispose();
      }
      m.dispose();
    }
  });
}

/** Loads the GLBs, sits them on the disc and spins them with the ticks. */
function Truck({
  urls,
  theme,
  spin,
  still,
}: {
  urls: string[];
  theme: HeroTheme;
  spin: Spin;
  still: boolean;
}) {
  const gltfs = useGLTF(urls) as unknown as { scene: THREE.Object3D }[];
  const parts = useMemo(() => {
    const objs = gltfs.map((g) => g.scene.clone(true));
    objs.forEach((o) =>
      o.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh) m.castShadow = m.receiveShadow = true;
      }),
    );
    return objs;
  }, [gltfs]);

  const spinner = useRef<THREE.Group>(null);
  const truck = useRef<THREE.Group>(null);

  // Center on the disc and rest the lowest point on its top face.
  useLayoutEffect(() => {
    const g = truck.current!;
    g.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(g);
    const center = box.getCenter(new THREE.Vector3());
    g.position.set(-center.x, DISC.height - box.min.y, -center.z);
  }, [parts]);

  // GLTF cache and clones share GPU resources; free them with the scene.
  useEffect(
    () => () => {
      parts.forEach(disposeObject);
      useGLTF.clear(urls);
    },
    [parts, urls],
  );

  useFrame((_, delta) => {
    if (!still) spin.step(delta);
    spinner.current!.rotation.y = spin.angle;
  });

  return (
    <group ref={spinner}>
      <group ref={truck}>
        {parts.map((p, i) => (
          <primitive key={i} object={p} />
        ))}
      </group>
      <Ticks theme={theme} />
    </group>
  );
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });
  return null;
}

export default function ShowroomScene({
  theme,
  model,
  mobile,
  active,
  inputTarget,
  still = false,
  onReady,
}: Props) {
  const urls = useMemo(() => (model ? [model] : defaultUrls()), [model]);
  const [spin] = useState(() => new Spin());

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => spin.setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [spin]);

  // Horizontal drag and ←/→ keys rotate the turntable.
  useEffect(() => {
    const el = inputTarget;
    if (!el) return;
    let dragging = false;
    let lastX = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
      spin.hold();
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      spin.nudge((e.clientX - lastX) * MOTION.dragSensitivity);
      lastX = e.clientX;
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.releasePointerCapture(e.pointerId);
      spin.hold();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      spin.nudge((e.key === "ArrowRight" ? 1 : -1) * MOTION.keyStep);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("keydown", key);
    };
  }, [inputTarget, spin]);

  return (
    <Canvas
      shadows="soft"
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: SCENE_THEMES[theme].exposure,
      }}
      camera={{ fov: CAMERA.fov, near: 0.1, far: 100 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <CameraRig mobile={mobile} />
      <Lights theme={theme} mobile={mobile} />
      <Turntable theme={theme} />
      <Suspense fallback={null}>
        <Truck urls={urls} theme={theme} spin={spin} still={still} />
        <FirstFrame onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
