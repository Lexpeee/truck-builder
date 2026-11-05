/** Paint presets offered in the builder. Hex values are sRGB, as on the swatch cards. */
export const PAINT_COLORS = [
  { id: "white", name: "White", hex: "#F1F2EF" },
  { id: "nwt-blue", name: "NWT Blue", hex: "#1F5EFF" },
  { id: "safety-orange", name: "Safety Orange", hex: "#E0662B" },
  { id: "charcoal", name: "Charcoal", hex: "#2B2F36" },
  { id: "black", name: "Black", hex: "#111214" },
] as const;

export type PaintColor = (typeof PAINT_COLORS)[number];
export type PaintColorId = PaintColor["id"];

/**
 * The material each GLB paints with (checked by `npm run models:check`):
 * a vehicle's cab and chassis, or a painted upfit (body or rack).
 */
export const PAINT_MATERIAL = { vehicle: "body-paint", upfit: "upfit-paint" } as const;

/** The vehicle's color plus one per upfit id. An upfit without its own color matches the vehicle. */
export type Paint = { vehicle: PaintColorId; upfits: Partial<Record<string, PaintColorId>> };

export const DEFAULT_PAINT: Paint = { vehicle: "white", upfits: {} };

export const getPaintColor = (id: string) => PAINT_COLORS.find((c) => c.id === id);
