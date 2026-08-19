"use client";
import { GLBModel, UPFITS, VEHICLES } from "@/public/models";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";

const Model = (props: { model: GLBModel }) => {
  const { model } = props;
  const { scene } = useGLTF(`/models/${model.fileName}`);
  return (
    <primitive
      object={scene}
      scale={1}
      position={model.initialConfig?.position}
    />
  );
};

// 2. Set up the Canvas container
export default function ModelViewer() {
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);
  const [selectedUpfits, setSelectedUpfits] = useState([UPFITS[0], UPFITS[1]]);

  return (
    <div className="w-full h-screen bg-neutral-50 flex items-center justify-center">
      <Canvas camera={{ position: [10, 5, 5], fov: 30 }}>
        {/* Lights are required to see the material properly */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment files="/hdri/grasslands_sunset_4k.hdr" />

        {/* Suspense is required while the external model file downloads */}
        <Suspense fallback={null}>
          {/* model */}
          <Model model={selectedVehicle} />
          {/* upfit */}
          {selectedUpfits.map((selectedUpfit, i) => (
            <Model model={selectedUpfit} key={i} />
          ))}
        </Suspense>

        {/* OrbitControls let you rotate the camera with your mouse */}
        <OrbitControls />
      </Canvas>
    </div>
  );
}
