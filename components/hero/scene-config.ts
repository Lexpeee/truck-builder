export type HeroTheme = "dark" | "light";

/** Scene values from DESIGN.md §3 (3D scene) and §5. Keyed by theme. */
export const SCENE_THEMES = {
  dark: {
    disc: { color: "#10151C", roughness: 0.55, metalness: 0.4 },
    ring: { color: "#3EA6FF", emissive: "#3EA6FF", emissiveIntensity: 1.4 },
    tick: { color: "#1E3A57", emissive: "#1E3A57", emissiveIntensity: 0.6 },
    hemi: { sky: "#DFE8F5", ground: "#1A1D22", intensity: 0.75 },
    key: { color: "#FFFFFF", intensity: 1.5 },
    rim: { color: "#9CC8FF", intensity: 0.7 },
    fill: { color: "#FFFFFF", intensity: 0.35 },
    exposure: 1.05,
  },
  light: {
    disc: { color: "#D6DCE5", roughness: 0.55, metalness: 0.15 },
    ring: { color: "#1F5EFF", emissive: "#1F5EFF", emissiveIntensity: 0.5 },
    tick: { color: "#A9B4C3", emissive: "#000000", emissiveIntensity: 0 },
    hemi: { sky: "#FFFFFF", ground: "#C4CCD8", intensity: 0.85 },
    key: { color: "#FFFFFF", intensity: 1.35 },
    rim: { color: "#DCE6FF", intensity: 0.55 },
    fill: { color: "#FFFFFF", intensity: 0.35 },
    exposure: 0.95,
  },
} as const;

export const KEY_POSITION = [6, 10, 5] as const;
export const RIM_POSITION = [-8, 5, -6] as const;
export const FILL_POSITION = [-4, 3, 8] as const;

export const CAMERA = {
  fov: 26,
  target: [0, 1.0, 0] as const,
  desktop: [8.2, 4.6, 8.2] as const,
  /** 4:3 canvas on small screens: pull back so the full turntable fits. */
  mobile: [9.5, 5.2, 9.5] as const,
};

export const DISC = { radius: 4.3, height: 0.12 };

export const MOTION = {
  initialRotation: -0.35,
  autoRotate: 0.28, // rad/s
  resumeAfterMs: 1500,
  dragSensitivity: 0.008, // rad per px
  keyStep: 0.15, // rad per press
};

export const SHADOW = { desktopMap: 2048, mobileMap: 1024, extent: 7, bias: -0.0005 };

/** The configuration shown in the hero. Chips in ShowroomHero describe this. */
export const HERO_BUILD = {
  vehicleId: "ram-2500hd-cc",
  upfitIds: ["ram-696j-body", "ram-696j-utility-rack", "ram-696j-step-bumper"],
};
