/** Render settings: lowPower trades smoothness for GPU headroom (e.g. during a video call). */
export const RENDER_CONFIG = {
  /** "auto" picks low-power on weak or mobile devices; true/false forces it. `?lowpower=1|0` overrides. */
  lowPower: "auto" as "auto" | boolean,
  fps: { normal: 60, lowPower: 30 },
  maxDpr: { desktop: 1.5, mobile: 1.25 },
  lowPowerMaxCores: 4,
};

export type RenderBudget = { fps: number; maxDpr: number; lowPower: boolean };

const MOBILE_QUERY = "(max-width: 767px), (pointer: coarse)";

/** Client-only; on the server it returns the desktop budget. */
export function getRenderBudget(): RenderBudget {
  if (typeof window === "undefined") {
    return { fps: RENDER_CONFIG.fps.normal, maxDpr: RENDER_CONFIG.maxDpr.desktop, lowPower: false };
  }
  const mobile = window.matchMedia(MOBILE_QUERY).matches;
  const param = new URLSearchParams(window.location.search).get("lowpower");
  const lowPower =
    param !== null
      ? param === "1"
      : RENDER_CONFIG.lowPower === "auto"
        ? mobile || navigator.hardwareConcurrency <= RENDER_CONFIG.lowPowerMaxCores
        : RENDER_CONFIG.lowPower;
  return {
    fps: lowPower ? RENDER_CONFIG.fps.lowPower : RENDER_CONFIG.fps.normal,
    maxDpr: mobile ? RENDER_CONFIG.maxDpr.mobile : RENDER_CONFIG.maxDpr.desktop,
    lowPower,
  };
}
