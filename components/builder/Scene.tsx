"use client";
import { getUpfit, getVehicle, type Upfit, type Vehicle } from "@/lib/catalog";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";

const Model = ({ item }: { item: Vehicle | Upfit }) => {
  const { scene } = useGLTF(`/models/${item.fileName}`);
  // Clone so the same GLB can be re-mounted without stealing the cached scene.
  const object = useMemo(() => scene.clone(true), [scene]);
  const position = "position" in item ? item.position : undefined;
  return <primitive object={object} position={position} />;
};

export default function Scene({
  vehicleId,
  upfitIds,
}: {
  vehicleId: string;
  upfitIds: string[];
}) {
  const vehicle = getVehicle(vehicleId);
  return (
    <Canvas camera={{ position: [10, 5, 5], fov: 30 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Environment files="/hdri/grasslands_sunset_4k.hdr" />
      <Suspense fallback={null}>
        {vehicle && <Model item={vehicle} />}
        {upfitIds.map((id) => {
          const upfit = getUpfit(id);
          return upfit && <Model key={id} item={upfit} />;
        })}
      </Suspense>
      <OrbitControls makeDefault />
    </Canvas>
  );
}
