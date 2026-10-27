"use client";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { HERO_BUILD, type HeroTheme } from "@/components/showroom/scene-config";

const ShowroomScene = dynamic(() => import("@/components/showroom/ShowroomScene"), {
  ssr: false,
});

export default function PosterStage({ theme }: { theme: HeroTheme }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(
    (r: boolean) => r && setTimeout(() => setReady(true), 300),
    [],
  );
  return (
    <div
      ref={setEl}
      data-poster-ready={ready || undefined}
      style={{ position: "relative", width: 2000, height: 940 }}
    >
      <style>{"html,body{background:transparent!important}"}</style>
      {el && (
        <ShowroomScene
          {...HERO_BUILD}
          interaction="turntable"
          theme={theme}
          mobile={false}
          active
          still
          inputTarget={null}
          onReady={onReady}
        />
      )}
    </div>
  );
}
