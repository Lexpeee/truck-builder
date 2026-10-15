"use client";
import BuilderPanel from "@/components/builder/BuilderPanel";
import Scene from "@/components/builder/Scene";
import { changeVehicle, toggleUpfit, type Build } from "@/lib/builder";
import { VEHICLES, getVehicle } from "@/lib/catalog";
import { Rotate3d, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TruckBuilder() {
  const [build, setBuild] = useState<Build>(() =>
    changeVehicle(VEHICLES[0].id),
  );
  const [notices, setNotices] = useState<string[]>([]);

  return (
    <div className="flex h-dvh w-full flex-col">
      <header className="z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-extrabold"
          aria-label="New Work Trucks home"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Truck className="size-4" />
          </span>
          <span className="hidden sm:inline">New Work Trucks</span>
        </Link>
        <span aria-hidden className="h-5 w-px bg-border" />
        <h1 className="truncate text-sm font-semibold sm:text-base">
          {getVehicle(build.vehicleId)?.name}
        </h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-0 flex-1 bg-gradient-to-b from-primary/10 to-background">
          <Scene vehicleId={build.vehicleId} upfitIds={build.upfitIds} />
          <p className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground whitespace-nowrap backdrop-blur">
            <Rotate3d className="size-3.5" /> Drag to rotate · Pinch to zoom
          </p>
        </div>

        {/* Bottom sheet on phones, sidebar on large screens. */}
        <aside className="max-h-[52dvh] shrink-0 overflow-y-auto rounded-t-2xl border-t bg-background shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:h-auto lg:w-96 lg:rounded-none lg:border-t-0 lg:border-l lg:shadow-none">
          <BuilderPanel
            build={build}
            notices={notices}
            onChangeVehicle={(id) => {
              if (id === build.vehicleId) return;
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
        </aside>
      </div>
    </div>
  );
}
