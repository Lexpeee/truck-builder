"use client";
import { useBuilderStore } from "@/lib/builder-store";
import { getUpfit, getVehicle, type Upfit, type Vehicle } from "@/lib/catalog";
import {
  AdaptiveDpr,
  ContactShadows,
  Detailed,
  Environment,
  Lightformer,
  OrbitControls,
  PerformanceMonitor,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Helmet } from "react-helmet-async";
import RenderStats, { statsEnabled } from "../three/RenderStats";
import { getRenderBudget } from "@/lib/render-budget";
import { AUTO_ROTATE_FPS } from "../hero/scene-config";
import { Lights, Ticks, Turntable } from "../hero/ShowroomScene";
import {
  FrameCap,
  FrameRateIndependentDamping,
  RenderGate,
} from "../three/render-loop";

const Model = ({ item }: { item: Vehicle | Upfit }) => {
  const { scene } = useGLTF(`/models/${item.fileName}`);
  // Clone so the same GLB can be re-mounted without stealing the cached scene.
  const object = useMemo(() => scene.clone(true), [scene]);
  const position = "position" in item ? item.position : undefined;
  return <primitive object={object} position={position} />;
};

const CAMERA_POSITION: [number, number, number] = [10, 5, 5];
/** Narrowest aspect ratio at which the whole truck fits at the base distance. */
const FIT_ASPECT = 1.5;

/**
 * The camera's field of view is vertical, so a tall, narrow viewport (a phone
 * in portrait) crops the truck's length. Pull the camera back to compensate.
 */
const FitToViewport = () => {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  useEffect(() => {
    const base = Math.hypot(...CAMERA_POSITION);
    camera.position.setLength(base * Math.max(1, FIT_ASPECT / aspect));
  }, [camera, aspect]);
  return null;
};

/** Orbit speed in rad/s (OrbitControls' autoRotateSpeed 1: one turn a minute). */
const ORBIT_RATE = (2 * Math.PI) / 60;

/**
 * OrbitControls' own autoRotate re-invalidates every frame, which would run
 * at the display rate. Drive the orbit from the auto-rotate FrameCap instead.
 */
const AutoRotate = ({ enabled }: { enabled: boolean }) => {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const onTick = useCallback(
    (dt: number) =>
      controls?.setAzimuthalAngle(controls.getAzimuthalAngle() - ORBIT_RATE * dt),
    [controls],
  );
  return <FrameCap
      enabled={enabled && !!controls}
      fps={AUTO_ROTATE_FPS}
      onTick={onTick}
    />;
};

/**
 * Mounted alongside the models inside their Suspense boundary, so it only
 * reports ready once every model is loaded, parsed, and shown. Layout effects
 * are cleaned up when the boundary suspends again (e.g. on a vehicle change).
 */
const ReadySignal = ({ onChange }: { onChange: (ready: boolean) => void }) => {
  useLayoutEffect(() => {
    onChange(true);
    return () => onChange(false);
  }, [onChange]);
  return null;
};

const LoadingOverlay = () => {
  // Download progress; parsing time after the download is not counted.
  const { active, progress } = useProgress();
  const pct = active ? Math.round(progress) : 100;
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
    >
      <div className="w-48 rounded-full bg-background/80 p-1 shadow-sm backdrop-blur">
        <div
          className="h-1.5 animate-pulse rounded-full bg-primary transition-[width]"
          style={{ width: `${Math.max(5, pct)}%` }}
        />
      </div>
      {active ? `Loading 3D model… ${pct}%` : "Preparing 3D model…"}
    </div>
  );
};

export default function Scene() {
  const vehicleId = useBuilderStore((s) => s.build.vehicleId);
  const upfitIds = useBuilderStore((s) => s.build.upfitIds);
  const vehicle = getVehicle(vehicleId);
  const [ready, setReady] = useState(false);
  const [budget] = useState(getRenderBudget);

  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    setIsClicked(false);
  }, [vehicleId]);

  return (
    <>
      <Helmet>
        <title>{vehicle?.name || "Showroom"} | NWT Truck Builder</title>
      </Helmet>
      <Canvas
        frameloop="never"
        dpr={[1, budget.maxDpr]}
        camera={{ position: CAMERA_POSITION, fov: 30 }}
        shadows
        onClick={(e) => setIsClicked(true)}
      >
        <RenderGate fps={budget.fps} />
        {statsEnabled() && <RenderStats />}
        <FrameRateIndependentDamping />
        <AdaptiveDpr />
        <PerformanceMonitor />
        <ContactShadows frames={1} />
        <FitToViewport />
        <AutoRotate enabled={!isClicked} />
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          {/* <Environment files="/hdri/grasslands_sunset_4k.hdr" /> */}
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
            {/* cool rim from behind (dark theme): pick out the silhouette */}
            <Lightformer
              form="ring"
              color="#3EA6FF"
              intensity={1.5}
              position={[-5, 3, -6]}
              scale={3}
            />
          </Environment>
          {vehicle && <Model item={vehicle} />}
          {upfitIds.map((id) => {
            const upfit = getUpfit(id);
            return upfit && <Model key={id} item={upfit} />;
          })}
          <Lights theme="dark" />
          <Turntable theme="light" />
          <ReadySignal onChange={setReady} />
          <Ticks theme="light" />
        </Suspense>
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
      </Canvas>
      {!ready && <LoadingOverlay />}
    </>
  );
}
