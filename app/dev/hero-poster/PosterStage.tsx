"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { HeroTheme } from "@/components/hero/scene-config";

const ShowroomScene = dynamic(() => import("@/components/hero/ShowroomScene"), {
  ssr: false,
});

export default function PosterStage({ theme }: { theme: HeroTheme }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  return (
    <div
      ref={setEl}
      data-poster-ready={ready || undefined}
      style={{ position: "relative", width: 2000, height: 940 }}
    >
      <style>{"html,body{background:transparent!important}"}</style>
      {el && (
        <ShowroomScene
          theme={theme}
          mobile={false}
          active
          still
          inputTarget={null}
          onReady={() => setTimeout(() => setReady(true), 300)}
        />
      )}
    </div>
  );
}
