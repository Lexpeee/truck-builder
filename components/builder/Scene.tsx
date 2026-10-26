"use client";
import { getUpfit, getVehicle, type Upfit, type Vehicle } from "@/lib/catalog";
import {
  Environment,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Lights, Ticks, Turntable } from "../hero/ShowroomScene";

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

export default function Scene({
  vehicleId,
  upfitIds,
}: {
  vehicleId: string;
  upfitIds: string[];
}) {
  const vehicle = getVehicle(vehicleId);
  const [ready, setReady] = useState(false);

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
        frameloop="demand"
        camera={{ position: CAMERA_POSITION, fov: 30 }}
        shadows
        onClick={(e) => setIsClicked(true)}
      >
        <FitToViewport />
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          {/* <Environment files="/hdri/grasslands_sunset_4k.hdr" /> */}
          {vehicle && <Model item={vehicle} />}
          {upfitIds.map((id) => {
            const upfit = getUpfit(id);
            return upfit && <Model key={id} item={upfit} />;
          })}
          <Lights theme="dark" mobile={false} />
          <Turntable theme="light" />
          <ReadySignal onChange={setReady} />
          <Ticks theme="light" />
        </Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          enableZoom
          autoRotate={!isClicked}
          autoRotateSpeed={1}
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
