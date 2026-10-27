"use client";
import { getUpfit, getVehicle } from "@/lib/catalog";
import {
  AdaptiveDpr,
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  PerformanceMonitor,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getRenderBudget } from "@/lib/render-budget";
import RenderStats, { statsEnabled } from "../three/RenderStats";
import {
  FrameCap,
  FrameRateIndependentDamping,
  RenderGate,
} from "../three/render-loop";
import {
  CAMERA,
  DISC,
  AUTO_ROTATE_FPS,
  FILL_POSITION,
  KEY_POSITION,
  MOTION,
  RIM_POSITION,
  SCENE_THEMES,
  SHADOW,
  type HeroTheme,
} from "./scene-config";

const TICK_COUNT = 36 * 2;

type Part = { url: string; position?: [number, number, number] };

const partFor = (item: { fileName: string; position?: [number, number, number] }): Part => ({
  url: `/models/${item.fileName}`,
  position: item.position,
});

type Props = {
  /** The vehicle and its installed upfits, rendered in catalog order. */
  vehicleId: string;
  upfitIds: string[];
  /** Optional GLB URL replacing the catalog build. */
  model?: string;
  theme: HeroTheme;
  /** Lighting theme when it differs from the disc and ticks. */
  lightsTheme?: HeroTheme;
  /**
   * "turntable": fixed camera, the model spins on the disc (drag / arrow keys).
   * "orbit": free OrbitControls around a stationary model.
   */
  interaction: "turntable" | "orbit";
  /** Narrow (<768px) layout: pulled-back camera. Turntable only. */
  mobile?: boolean;
  /** False stops rendering (off-screen or hidden tab). */
  active?: boolean;
  /** Element that receives drag and arrow-key input. Turntable only. */
  inputTarget?: HTMLElement | null;
  /** Poster rendering: hold the initial rotation. */
  still?: boolean;
  /** True after the first frame with every model shown; false while loading. */
  onReady: (ready: boolean) => void;
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
    if (!this.reduced && idle)
      this.angle += MOTION.autoRotate * Math.min(delta, 0.1);
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

export function Lights({ theme }: { theme: HeroTheme }) {
  const c = SCENE_THEMES[theme];
  const map = SHADOW.map;
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
      <directionalLight
        color={c.rim.color}
        intensity={c.rim.intensity}
        position={RIM_POSITION}
      />
      <directionalLight
        color={c.fill.color}
        intensity={c.fill.intensity}
        position={FILL_POSITION}
      />
    </>
  );
}

export function Turntable({ theme }: { theme: HeroTheme }) {
  const c = SCENE_THEMES[theme];
  return (
    <>
      <mesh position={[0, DISC.height / 2, 0]} receiveShadow>
        <cylinderGeometry args={[DISC.radius, DISC.radius, DISC.height, 96]} />
        <meshStandardMaterial {...c.disc} />
      </mesh>
      <mesh position={[0, DISC.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {/* <torusGeometry args={[DISC.radius - 0.05, 0.04, 12, 160]} /> */}
        <meshStandardMaterial {...c.ring} />
      </mesh>
    </>
  );
}

export function Ticks({ theme }: { theme: HeroTheme }) {
  const c = SCENE_THEMES[theme].tick;
  return (
    <>
      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const currentColor = i % 2 === 0 ? "#ffee02" : "#333333"; // Alternate colors for ticks
        const a = (i / TICK_COUNT) * Math.PI * 2;
        const r = DISC.radius - 0.25;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r, DISC.height + 0.005, Math.sin(a) * r]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[0.28, 0.01, 0.35]} />
            <meshStandardMaterial
              {...{
                ...c,
                color: currentColor, // Use the alternating color
              }}
            />
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
    for (const m of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]) {
      for (const v of Object.values(m)) {
        if (v instanceof THREE.Texture) v.dispose();
      }
      m.dispose();
    }
  });
}

const Model = ({ url, position }: Part) => {
  const { scene } = useGLTF(url);
  // Clone so the same GLB can be re-mounted without stealing the cached scene.
  const object = useMemo(() => {
    const o = scene.clone(true);
    o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh) m.castShadow = m.receiveShadow = true;
    });
    return o;
  }, [scene]);
  useEffect(() => () => disposeObject(object), [object]);
  return <primitive object={object} position={position} />;
};

/** Sits the parts on the disc with the ticks; the turntable also spins them. */
function Truck({
  parts,
  theme,
  spin,
  still,
}: {
  parts: Part[];
  theme: HeroTheme;
  /** Present for the turntable: centers the parts and rotates the group. */
  spin?: Spin;
  still: boolean;
}) {
  const spinner = useRef<THREE.Group>(null);
  const truck = useRef<THREE.Group>(null);
  const key = parts.map((p) => p.url).join("|");

  // Center on the disc and rest the lowest point on its top face. Re-runs when
  // the parts change or the Suspense boundary reveals them again.
  useLayoutEffect(() => {
    if (!spin) return;
    const g = truck.current!;
    g.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(g);
    const center = box.getCenter(new THREE.Vector3());
    g.position.set(-center.x, DISC.height - box.min.y, -center.z);
  }, [spin, key]);

  useFrame((_, delta) => {
    if (!spin) return;
    if (!still) spin.step(delta);
    spinner.current!.rotation.y = spin.angle;
  });

  return (
    <group ref={spinner}>
      <group ref={truck}>
        {parts.map((p) => (
          <Model key={p.url} {...p} />
        ))}
      </group>
      <Ticks theme={theme} />
    </group>
  );
}

/**
 * Mounted inside the models' Suspense boundary, so it only reports ready once
 * every model is loaded and a frame has been drawn. Layout effects are cleaned
 * up when the boundary suspends again (e.g. on a vehicle change).
 */
function ReadySignal({ onReady }: { onReady: (ready: boolean) => void }) {
  const done = useRef(false);
  useLayoutEffect(() => {
    done.current = false;
    return () => onReady(false);
  }, [onReady]);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady(true);
  });
  return null;
}

const ORBIT_CAMERA: [number, number, number] = [10, 5, 5];
/** Narrowest aspect ratio at which the whole truck fits at the base distance. */
const FIT_ASPECT = 1.5;

/**
 * The camera's field of view is vertical, so a tall, narrow viewport (a phone
 * in portrait) crops the truck's length. Pull the camera back to compensate.
 */
function FitToViewport() {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  useEffect(() => {
    const base = Math.hypot(...ORBIT_CAMERA);
    camera.position.setLength(base * Math.max(1, FIT_ASPECT / aspect));
  }, [camera, aspect]);
  return null;
}

/** Orbit speed in rad/s (OrbitControls' autoRotateSpeed 1: one turn a minute). */
const ORBIT_RATE = (2 * Math.PI) / 60;

/**
 * OrbitControls' own autoRotate re-invalidates every frame, which would run
 * at the display rate. Drive the orbit from the auto-rotate FrameCap instead.
 */
function AutoRotate({ enabled }: { enabled: boolean }) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const onTick = useCallback(
    (dt: number) =>
      controls?.setAzimuthalAngle(controls.getAzimuthalAngle() - ORBIT_RATE * dt),
    [controls],
  );
  return (
    <FrameCap enabled={enabled && !!controls} fps={AUTO_ROTATE_FPS} onTick={onTick} />
  );
}

/** Studio reflections and fill for the orbit view. */
function StudioEnvironment() {
  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Environment resolution={256} frames={1}>
        {/* overhead softbox: long highlight along the roof and service body */}
        <Lightformer
          form="rect"
          intensity={3}
          position={[0, 6, 0]}
          rotation-x={Math.PI / 2}
          scale={[12, 2, 1]}
        />
        {/* side strips: highlight lines along the doors */}
        <Lightformer
          form="rect"
          intensity={2}
          position={[-6, 2, 0]}
          rotation-y={Math.PI / 2}
          scale={[10, 1.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          position={[6, 2, 0]}
          rotation-y={-Math.PI / 2}
          scale={[10, 1.2, 1]}
        />
        {/* cool rim from behind: pick out the silhouette */}
        <Lightformer
          form="ring"
          color="#3EA6FF"
          intensity={1.5}
          position={[-5, 3, -6]}
          scale={3}
        />
      </Environment>
    </>
  );
}

export default function ShowroomScene({
  vehicleId,
  upfitIds,
  model,
  theme,
  lightsTheme = theme,
  interaction,
  mobile = false,
  active = true,
  inputTarget = null,
  still = false,
  onReady,
}: Props) {
  const turntable = interaction === "turntable";
  const parts = useMemo<Part[]>(() => {
    if (model) return [{ url: model }];
    const vehicle = getVehicle(vehicleId);
    return [vehicle, ...upfitIds.map(getUpfit)]
      .filter((i) => i !== undefined)
      .map(partFor);
  }, [model, vehicleId, upfitIds]);
  const [spin] = useState(() => new Spin());
  const [reduced, setReduced] = useState(false);
  // Orbit auto-rotate stops on click and resumes for the next vehicle.
  const [stoppedFor, setStoppedFor] = useState<string | null>(null);
  const [budget] = useState(getRenderBudget);
  const invalidateRef = useRef<() => void>(() => {});

  // Free the GLB cache with the scene.
  const urlsRef = useRef<string[]>([]);
  useEffect(() => {
    urlsRef.current = parts.map((p) => p.url);
  }, [parts]);
  useEffect(() => () => useGLTF.clear(urlsRef.current), []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      spin.setReducedMotion(mq.matches);
      setReduced(mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [spin]);

  // Horizontal drag and ←/→ keys rotate the turntable.
  useEffect(() => {
    const el = inputTarget;
    if (!el || !turntable) return;
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
      invalidateRef.current();
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
      invalidateRef.current();
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
  }, [inputTarget, turntable, spin]);

  const animate = active && !still && !reduced;

  return (
    <Canvas
      frameloop="never"
      shadows="soft"
      dpr={[1, budget.maxDpr]}
      onClick={turntable ? undefined : () => setStoppedFor(vehicleId)}
      onCreated={({ get }) => {
        // RenderGate swaps `invalidate`, so always call the current one.
        invalidateRef.current = () => get().invalidate();
      }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: turntable ? SCENE_THEMES[theme].exposure : 1,
      }}
      camera={{ position: ORBIT_CAMERA, fov: 30 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <AdaptiveDpr />
      <PerformanceMonitor />
      <ContactShadows frames={1} />
      <RenderGate fps={budget.fps} active={active} />
      {statsEnabled() && <RenderStats />}
      <Lights theme={lightsTheme} />
      <Turntable theme={theme} />
      {turntable ? (
        <>
          <CameraRig mobile={mobile} />
          <FrameCap enabled={animate} fps={AUTO_ROTATE_FPS} />
        </>
      ) : (
        <>
          <FitToViewport />
          <FrameRateIndependentDamping />
          <AutoRotate enabled={animate && stoppedFor !== vehicleId} />
          <OrbitControls
            makeDefault
            enableDamping
            enableZoom
            minZoom={1}
            maxZoom={1}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.5}
          />
        </>
      )}
      <Suspense fallback={null}>
        {!turntable && <StudioEnvironment />}
        <Truck
          parts={parts}
          theme={theme}
          spin={turntable ? spin : undefined}
          still={still}
        />
        <ReadySignal onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
