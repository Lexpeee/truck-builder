import { create } from "zustand";
import { changeVehicle, toggleUpfit, type Build } from "./builder";
import { VEHICLES } from "./catalog";

type BuilderState = {
  build: Build;
  /** Side effects of the last change, e.g. "Added 696J Body (required)". */
  notices: string[];
  changeVehicle: (id: string) => void;
  toggleUpfit: (id: string) => void;
  dismissNotices: () => void;
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  build: changeVehicle(VEHICLES[0].id),
  notices: [],
  changeVehicle: (id) => {
    if (id === get().build.vehicleId) return;
    set({ build: changeVehicle(id), notices: [] });
  },
  toggleUpfit: (id) => {
    const { build, notices } = toggleUpfit(get().build, id);
    set({ build, notices });
  },
  dismissNotices: () => set({ notices: [] }),
}));
