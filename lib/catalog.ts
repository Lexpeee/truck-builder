export type UpfitCategory = "body" | "rack" | "bumper";

export type Vehicle = {
  id: string;
  name: string;
  fileName: string;
  /** Upfits selected when this vehicle is first chosen. */
  defaultUpfitIds: string[];
};

export type Upfit = {
  id: string;
  name: string;
  category: UpfitCategory;
  fileName: string;
  position?: [number, number, number];
  /** Vehicles this upfit fits. */
  vehicleIds: string[];
  /** Upfits that must be installed first (pre-requisites). */
  requires?: string[];
  /** Upfits that can never be combined with this one, beyond slot exclusivity. */
  conflictsWith?: string[];
};

export type CategoryInfo = {
  id: UpfitCategory;
  label: string;
  /** Only one upfit from an exclusive category can be installed at a time. */
  exclusive: boolean;
};

export const CATEGORIES: CategoryInfo[] = [
  { id: "body", label: "Body", exclusive: true },
  { id: "rack", label: "Racks", exclusive: false },
  { id: "bumper", label: "Bumpers", exclusive: true },
];

export const VEHICLES: Vehicle[] = [
  {
    id: "ram-2500hd-cc",
    name: "RAM 2500HD CC",
    fileName: "RAM 2500HD CC.glb",
    defaultUpfitIds: ["ram-696j-body"],
  },
  {
    id: "chevy-express-3500",
    name: "Chevrolet Express 3500",
    fileName: "Chevrolet express 3500.glb",
    defaultUpfitIds: [],
  },
];

export const UPFITS: Upfit[] = [
  {
    id: "ram-696j-body",
    name: "696J Body",
    category: "body",
    fileName: "RAM 2500HD CC 696j Body.glb",
    vehicleIds: ["ram-2500hd-cc"],
  },
  {
    id: "ram-696j-utility-rack",
    name: "696J Utility Rack",
    category: "rack",
    fileName: "RAM 2500HD CC 696j Utility Rack.glb",
    vehicleIds: ["ram-2500hd-cc"],
    requires: ["ram-696j-body"],
  },
  {
    id: "ram-696j-hitch-recess-bumper",
    name: "696J Hitch Recess Bumper",
    category: "bumper",
    fileName: "RAM 2500HD CC 696j Hitch Recess Bumper.glb",
    vehicleIds: ["ram-2500hd-cc"],
    requires: ["ram-696j-body"],
  },
  {
    id: "ram-696j-step-bumper",
    name: "696J Step Bumper",
    category: "bumper",
    fileName: "RAM 2500HD CC 696j Step Bumper.glb",
    vehicleIds: ["ram-2500hd-cc"],
    requires: ["ram-696j-body"],
  },
  {
    id: "ram-696j-straight-bumper",
    name: "696J Straight Bumper",
    category: "bumper",
    fileName: "RAM 2500HD CC 696j Straight Bumper.glb",
    vehicleIds: ["ram-2500hd-cc"],
    requires: ["ram-696j-body"],
  },
  {
    id: "chevy-kuv129su-body",
    name: "KUV129SU Body",
    category: "body",
    fileName: "Chev express 3500 - KUV129SU.glb",
    vehicleIds: ["chevy-express-3500"],
  },
  {
    id: "chevy-kuv129su-tri-wing-ladder-rack",
    name: "KUV129SU Tri-Wing Ladder Rack",
    category: "rack",
    fileName: "Chev express 3500 - KUV129SU - Tri wing ladder rack.glb",
    vehicleIds: ["chevy-express-3500"],
    requires: ["chevy-kuv129su-body"],
  },
];

export const getVehicle = (id: string) => VEHICLES.find((v) => v.id === id);
export const getUpfit = (id: string) => UPFITS.find((u) => u.id === id);
export const getCategory = (id: UpfitCategory) =>
  CATEGORIES.find((c) => c.id === id)!;

export const upfitsForVehicle = (vehicleId: string) =>
  UPFITS.filter((u) => u.vehicleIds.includes(vehicleId));
