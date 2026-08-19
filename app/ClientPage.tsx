"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GLBModel, UPFITS, VEHICLES } from "@/public/models";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ReactNode, Suspense, useEffect, useState } from "react";

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

const ScreenControls = ({
  children,
  vehicle,
  onChangeVehicle,
  onChangeUpfit,
}: {
  children: ReactNode;
  vehicle: GLBModel;
  onChangeVehicle: (id: number) => void;
  onChangeUpfit: (id: number) => void;
}) => {
  const filteredUpfits = UPFITS.filter((upfit) =>
    upfit.vehicleIds?.includes(vehicle.id),
  );

  return (
    <div className="h-full w-full relative flex flex-column">
      <div className="absolute p-4 bg-black w-full">
        <h1 style={{ zIndex: 100 }}>{vehicle.name}</h1>
      </div>
      <div style={{ height: "inherit", width: "inherit" }}>{children}</div>
      <div className="absolute p-4 bottom-0 w-full z-100">
        <div className="flex flex-row justify-center gap-2">
          <DropdownMenu
            onOpenChange={(open) => {
              if (!open) {
                setTimeout(() => {
                  document.body.style.pointerEvents = "";
                }, 100);
              }
            }}
          >
            <DropdownMenuTrigger render={<Button />}>
              {vehicle?.name}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {VEHICLES.map((vehicle, i) => (
                <DropdownMenuItem
                  key={i}
                  onClick={(e) => {
                    onChangeVehicle(vehicle.id);
                  }}
                >
                  {vehicle.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button />}>
              Upfits
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {filteredUpfits.map((upfit, i) => (
                <DropdownMenuItem
                  key={i}
                  onClick={(e) => {
                    onChangeUpfit(upfit.id);
                  }}
                >
                  {upfit.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default function ModelViewer() {
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);
  const [selectedUpfits, setSelectedUpfits] = useState([UPFITS[0], UPFITS[1]]);

  useEffect(() => {
    console.log(selectedUpfits);
  }, [selectedUpfits]);

  const handleSelectVehicle = (id: number) => {
    setSelectedVehicle(VEHICLES.find((v) => v.id === id));
    setSelectedUpfits(UPFITS.filter((u) => u?.vehicleIds?.includes(id)));
  };

  const handleSelectUpfits = (id: number) => {
    const selectedUpfit = UPFITS.find((u) => u.id === id);
    console.log(selectedUpfit);
    setSelectedUpfits((prevState) => {
      if (!prevState.find((p) => p.id === id)) {
        return [...prevState, selectedUpfit];
      } else {
        return prevState.filter((p) => p.id !== id);
      }
    });
  };

  return (
    <div className="w-full h-screen bg-gray-600 flex items-center justify-center">
      <ScreenControls
        vehicle={selectedVehicle}
        onChangeVehicle={(id) => {
          const vehicle = VEHICLES.find((v) => v.id === id);
          if (vehicle) handleSelectVehicle(id);
        }}
        onChangeUpfit={handleSelectUpfits}
      >
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
      </ScreenControls>
    </div>
  );
}
