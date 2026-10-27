"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/**
 * Dev-only overlay: rendered frames per second and draw calls per frame.
 * Enable with `?stats` on a non-production build. Idle shows 0 fps.
 */
export default function RenderStats() {
  const gl = useThree((s) => s.gl);
  const frames = useRef(0);
  const el = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const div = document.createElement("div");
    div.style.cssText =
      "position:fixed;top:8px;left:8px;z-index:50;padding:4px 8px;border-radius:6px;background:#000c;color:#0f0;font:12px/1.4 monospace;pointer-events:none";
    document.body.appendChild(div);
    el.current = div;
    const id = setInterval(() => {
      const { calls, triangles } = gl.info.render;
      div.textContent = `${frames.current} fps · ${calls} calls · ${(triangles / 1000).toFixed(0)}k tris`;
      frames.current = 0;
    }, 1000);
    return () => {
      clearInterval(id);
      div.remove();
    };
  }, [gl]);

  useFrame(() => {
    frames.current++;
  });
  return null;
}

export const statsEnabled = () =>
  process.env.NODE_ENV !== "production" &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("stats");
