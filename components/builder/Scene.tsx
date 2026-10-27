"use client";
import { useBuilderStore } from "@/lib/builder-store";
import { getVehicle } from "@/lib/catalog";
import { useProgress } from "@react-three/drei";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import ShowroomScene from "../showroom/ShowroomScene";

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
  const [ready, setReady] = useState(false);

  return (
    <>
      <Helmet>
        <title>{getVehicle(vehicleId)?.name || "Showroom"} | NWT Truck Builder</title>
      </Helmet>
      <ShowroomScene
        vehicleId={vehicleId}
        upfitIds={upfitIds}
        interaction="orbit"
        theme="light"
        lightsTheme="dark"
        onReady={setReady}
      />
      {!ready && <LoadingOverlay />}
    </>
  );
}
