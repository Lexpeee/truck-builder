import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";

// 1. Create a component to load and render the model
function MyModel() {
  // useGLTF inherently takes care of caching the loaded resources
  const { scene } = useGLTF("/models/RAM-2500HD-CC-696j-Body.glb");
  const [height, setHeight] = useState(1);
  
  useEffect(() => {
    setInterval(() => {
        setHeight((prevHeight) => (prevHeight <= 0.5 ? prevHeight : prevHeight - 0.05));
    }, 100);
  }, [])

  // The primitive component displays the raw Three.js object in the scene
  return <primitive object={scene} scale={1} position={[0.25, height, 0.65]} />;
}
function MyModel2() {
  // useGLTF inherently takes care of caching the loaded resources
  const { scene } = useGLTF("/models/RAM-2500HD-CC.glb");

  // The primitive component displays the raw Three.js object in the scene
  return <primitive object={scene} scale={1} />;
}

// 2. Set up the Canvas container
export default function ModelViewer() {
  return (
    <div className="w-full h-screen bg-neutral-50 flex items-center justify-center">
      <Canvas camera={{ position: [10, 5, 5], fov: 30 }}>
        {/* Lights are required to see the material properly */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />

        {/* Suspense is required while the external model file downloads */}
        <Suspense fallback={null}>
          <MyModel />
          <MyModel2 />
        </Suspense>

        {/* OrbitControls let you rotate the camera with your mouse */}
        <OrbitControls />
      </Canvas>
    </div>
  );
}
