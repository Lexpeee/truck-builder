"use client";
import { previewToggle, type Build } from "@/lib/builder";
import {
  CATEGORIES,
  VEHICLES,
  getUpfit,
  upfitsForVehicle,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

const nameList = (ids: string[]) =>
  ids.map((id) => getUpfit(id)?.name ?? id).join(", ");

export default function BuilderPanel({
  build,
  notices,
  onChangeVehicle,
  onToggleUpfit,
  onDismissNotices,
}: {
  build: Build;
  notices: string[];
  onChangeVehicle: (id: string) => void;
  onToggleUpfit: (id: string) => void;
  onDismissNotices: () => void;
}) {
  const available = upfitsForVehicle(build.vehicleId);
  const installed = new Set(build.upfitIds);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col gap-6 overflow-y-auto bg-zinc-900 p-4 text-zinc-100">
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Vehicle
        </h2>
        <div className="flex flex-col gap-1">
          {VEHICLES.map((v) => (
            <button
              key={v.id}
              onClick={() => onChangeVehicle(v.id)}
              aria-pressed={v.id === build.vehicleId}
              className={cn(
                "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                v.id === build.vehicleId
                  ? "border-white bg-zinc-800 font-semibold"
                  : "border-zinc-700 hover:bg-zinc-800",
              )}
            >
              {v.name}
            </button>
          ))}
        </div>
      </section>

      {CATEGORIES.map((category) => {
        const items = available.filter((u) => u.category === category.id);
        if (!items.length) return null;
        return (
          <section key={category.id}>
            <h2 className="mb-2 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {category.label}
              <span className="font-normal normal-case">
                {category.exclusive ? "choose one" : "choose any"}
              </span>
            </h2>
            <div className="flex flex-col gap-1">
              {items.map((upfit) => {
                const isOn = installed.has(upfit.id);
                const { adds, removes } = previewToggle(build, upfit.id);
                const hint = isOn
                  ? removes.length
                    ? `Also removes ${nameList(removes)}`
                    : null
                  : [
                      adds.length && `Also adds ${nameList(adds)}`,
                      removes.length && `Replaces ${nameList(removes)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || null;
                const needs = upfit.requires?.length
                  ? `Requires ${nameList(upfit.requires)}`
                  : null;
                return (
                  <button
                    key={upfit.id}
                    onClick={() => onToggleUpfit(upfit.id)}
                    role={category.exclusive ? "radio" : "checkbox"}
                    aria-checked={isOn}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      isOn
                        ? "border-emerald-400 bg-emerald-950/60"
                        : "border-zinc-700 hover:bg-zinc-800",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={isOn ? "font-semibold" : ""}>
                        {upfit.name}
                      </span>
                      {isOn && <span aria-hidden>✓</span>}
                    </span>
                    {(needs || hint) && (
                      <span className="mt-0.5 block text-xs text-zinc-400">
                        {[needs, hint].filter(Boolean).join(" — ")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {notices.length > 0 && (
        <section
          role="status"
          className="rounded-md border border-amber-500/50 bg-amber-950/40 p-3 text-xs"
        >
          <ul className="list-disc space-y-1 pl-4">
            {notices.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
          <button
            onClick={onDismissNotices}
            className="mt-2 underline underline-offset-2"
          >
            Dismiss
          </button>
        </section>
      )}

      <section className="mt-auto border-t border-zinc-700 pt-3 text-sm">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Your build
        </h2>
        {build.upfitIds.length ? (
          <ul className="space-y-0.5">
            {build.upfitIds.map((id) => (
              <li key={id}>{getUpfit(id)?.name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-400">Stock vehicle, no upfits.</p>
        )}
      </section>
    </aside>
  );
}
