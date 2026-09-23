"use client";
import BuilderPanel from "@/components/builder/BuilderPanel";
import Scene from "@/components/builder/Scene";
import { changeVehicle, toggleUpfit, type Build } from "@/lib/builder";
import { VEHICLES, getVehicle } from "@/lib/catalog";
import { useState } from "react";

export default function TruckBuilder() {
  const [build, setBuild] = useState<Build>(() =>
    changeVehicle(VEHICLES[0].id),
  );
  const [notices, setNotices] = useState<string[]>([]);

  return (
    <>
      <div className="flex h-screen w-full">
        <div className="relative min-w-0 flex-1">
          <h1 className="absolute left-0 top-0 z-10 bg-black/70 px-4 py-2 text-white">
            {getVehicle(build.vehicleId)?.name}
          </h1>
          <Scene vehicleId={build.vehicleId} upfitIds={build.upfitIds} />
        </div>
        <BuilderPanel
          build={build}
          notices={notices}
          onChangeVehicle={(id) => {
            setBuild(changeVehicle(id));
            setNotices([]);
          }}
          onToggleUpfit={(id) => {
            const result = toggleUpfit(build, id);
            setBuild(result.build);
            setNotices(result.notices);
          }}
          onDismissNotices={() => setNotices([])}
        />
      </div>
    </>
  );
}
