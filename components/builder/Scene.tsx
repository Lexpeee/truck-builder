"use client";
import { getUpfit, getVehicle, type Upfit, type Vehicle } from "@/lib/catalog";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { Helmet } from "react-helmet-async";

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
    <>
      <Helmet>
        <title>{vehicle?.name || "Showroom"} | NWT Truck Builder</title>
      </Helmet>
      <Canvas camera={{ position: [10, 5, 5], fov: 30 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment files="/hdri/grasslands_sunset_4k.hdr" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[4, 64]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.6} metalness={0.1} />
        </mesh>
        <Suspense fallback={null}>
          {vehicle && <Model item={vehicle} />}
          {upfitIds.map((id) => {
            const upfit = getUpfit(id);
            return upfit && <Model key={id} item={upfit} />;
          })}
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={(3 * Math.PI) / 4}
        />
      </Canvas>
    </>
  );
}
