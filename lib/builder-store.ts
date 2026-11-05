import { create } from "zustand";
import { changeVehicle, toggleUpfit, type Build } from "./builder";
import { VEHICLES } from "./catalog";
import type { PaintColorId } from "./paint";

type BuilderState = {
  build: Build;
  /** Side effects of the last change, e.g. "Added 696J Body (required)". */
  notices: string[];
  changeVehicle: (id: string) => void;
  toggleUpfit: (id: string) => void;
  /** Paints the vehicle (its id) or one upfit (its id). */
  setPaint: (targetId: string, color: PaintColorId) => void;
  dismissNotices: () => void;
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  build: changeVehicle(VEHICLES[0].id),
  notices: [],
  changeVehicle: (id) => {
    if (id === get().build.vehicleId) return;
    set({ build: changeVehicle(id, get().build.paint), notices: [] });
  },
  toggleUpfit: (id) => {
    const { build, notices } = toggleUpfit(get().build, id);
    set({ build, notices });
  },
  setPaint: (targetId, color) => {
    const { build } = get();
    const { paint } = build;
    const next =
      targetId === build.vehicleId
        ? { ...paint, vehicle: color }
        : { ...paint, upfits: { ...paint.upfits, [targetId]: color } };
    if (next.vehicle === paint.vehicle && next.upfits[targetId] === paint.upfits[targetId]) return;
    set({ build: { ...build, paint: next } });
  },
  dismissNotices: () => set({ notices: [] }),
}));
