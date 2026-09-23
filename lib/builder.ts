import {
  getCategory,
  getUpfit,
  getVehicle,
  upfitsForVehicle,
  type Upfit,
} from "./catalog";

/** A build is a vehicle plus a set of installed upfit ids. */
export type Build = { vehicleId: string; upfitIds: string[] };

export type BuildResult = {
  build: Build;
  /** Human-readable side effects, e.g. "Added 696J Body (required)". */
  notices: string[];
};

const names = (ids: string[]) =>
  ids.map((id) => getUpfit(id)?.name ?? id).join(", ");

/** Every upfit that depends (directly or transitively) on `id`. */
const dependentsOf = (id: string, installed: Set<string>): string[] => {
  const out = new Set<string>();
  const walk = (target: string) => {
    for (const other of installed) {
      if (!out.has(other) && getUpfit(other)?.requires?.includes(target)) {
        out.add(other);
        walk(other);
      }
    }
  };
  walk(id);
  return [...out];
};

/** Upfits that would be displaced if `upfit` were installed. */
const displacedBy = (upfit: Upfit, installed: Set<string>): string[] =>
  [...installed].filter((otherId) => {
    if (otherId === upfit.id) return false;
    const other = getUpfit(otherId)!;
    const sameExclusiveSlot =
      other.category === upfit.category && getCategory(upfit.category).exclusive;
    return (
      sameExclusiveSlot ||
      upfit.conflictsWith?.includes(otherId) ||
      other.conflictsWith?.includes(upfit.id)
    );
  });

/**
 * Install `id`, pulling in its pre-requisites and removing anything it
 * conflicts with. Removing a displaced upfit also removes its dependents.
 */
const install = (
  id: string,
  installed: Set<string>,
  notices: string[],
  reason?: string,
) => {
  const upfit = getUpfit(id);
  if (!upfit || installed.has(id)) return;

  const displaced = displacedBy(upfit, installed);
  if (displaced.length) {
    const removed = new Set<string>();
    for (const d of displaced) {
      removed.add(d);
      dependentsOf(d, installed).forEach((x) => removed.add(x));
    }
    removed.forEach((r) => installed.delete(r));
    notices.push(`Removed ${names([...removed])} (replaced by ${upfit.name})`);
  }

  // Add pre-requisites first so they are in place before the dependent upfit.
  for (const req of upfit.requires ?? []) install(req, installed, notices, upfit.name);

  installed.add(id);
  if (reason) notices.push(`Added ${upfit.name} (required by ${reason})`);
};

export const toggleUpfit = (build: Build, id: string): BuildResult => {
  const installed = new Set(build.upfitIds);
  const notices: string[] = [];

  if (installed.has(id)) {
    const dependents = dependentsOf(id, installed);
    installed.delete(id);
    dependents.forEach((d) => installed.delete(d));
    if (dependents.length) {
      notices.push(`Removed ${names(dependents)} (requires ${names([id])})`);
    }
  } else {
    install(id, installed, notices);
  }

  return {
    build: { ...build, upfitIds: orderedIds(build.vehicleId, installed) },
    notices,
  };
};

export const changeVehicle = (vehicleId: string): Build => {
  const vehicle = getVehicle(vehicleId);
  const installed = new Set<string>();
  vehicle?.defaultUpfitIds.forEach((id) => install(id, installed, []));
  return { vehicleId, upfitIds: orderedIds(vehicleId, installed) };
};

/** Catalog order keeps rendering and summaries stable. */
const orderedIds = (vehicleId: string, installed: Set<string>) =>
  upfitsForVehicle(vehicleId)
    .map((u) => u.id)
    .filter((id) => installed.has(id));

/** What choosing an upfit would do, for showing hints before the click. */
export const previewToggle = (build: Build, id: string) => {
  const installed = new Set(build.upfitIds);
  if (installed.has(id)) {
    return { adds: [], removes: dependentsOf(id, installed) };
  }
  const after = new Set(installed);
  install(id, after, []);
  return {
    adds: [...after].filter((x) => !installed.has(x) && x !== id),
    removes: [...installed].filter((x) => !after.has(x)),
  };
};
