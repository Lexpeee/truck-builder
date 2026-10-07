"use client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { previewToggle, type Build } from "@/lib/builder";
import {
  CATEGORIES,
  VEHICLES,
  getUpfit,
  getVehicle,
  upfitsForVehicle,
  type Upfit,
} from "@/lib/catalog";
import { ChevronDownIcon } from "lucide-react";

/** Radio value representing "no upfit installed" in an exclusive category. */
const NONE = "__none__";

const nameList = (ids: string[]) =>
  ids.map((id) => getUpfit(id)?.name ?? id).join(", ");

const triggerClassName =
  "flex w-full items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-left text-sm hover:bg-zinc-800 data-popup-open:border-white";

const menuContentClassName =
  "min-w-(--anchor-width) border border-zinc-700 bg-zinc-900 p-1 text-zinc-100 ring-0";

const menuItemClassName = "focus:bg-zinc-800 focus:text-zinc-100";

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

  const optionLabel = (upfit: Upfit) => {
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
      <div className="flex flex-col gap-0.5">
        <span>{upfit.name}</span>
        {(needs || hint) && (
          <span className="text-xs text-zinc-400">
            {[needs, hint].filter(Boolean).join(" — ")}
          </span>
        )}
      </div>
    );
  };

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col gap-6 overflow-y-auto bg-zinc-900 p-4 text-zinc-100">
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Vehicle
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger className={triggerClassName}>
            {getVehicle(build.vehicleId)?.name}
            <ChevronDownIcon className="size-4 shrink-0 text-zinc-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className={menuContentClassName}>
            <DropdownMenuRadioGroup
              value={build.vehicleId}
              onValueChange={(value) => onChangeVehicle(value as string)}
            >
              {VEHICLES.map((v) => (
                <DropdownMenuRadioItem
                  key={v.id}
                  value={v.id}
                  closeOnClick
                  className={menuItemClassName}
                >
                  {v.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      {CATEGORIES.map((category) => {
        const items = available.filter((u) => u.category === category.id);
        if (!items.length) return null;

        const selected = items.filter((u) => installed.has(u.id));
        const label = selected.length
          ? nameList(selected.map((u) => u.id))
          : "None";

        return (
          <section key={category.id}>
            <h2 className="mb-2 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {category.label}
              <span className="font-normal normal-case">
                {category.exclusive ? "choose one" : "choose any"}
              </span>
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger className={triggerClassName}>
                <span className="truncate">{label}</span>
                <ChevronDownIcon className="size-4 shrink-0 text-zinc-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className={menuContentClassName}>
                {category.exclusive ? (
                  <DropdownMenuRadioGroup
                    value={selected[0]?.id ?? NONE}
                    onValueChange={(value) => {
                      if (value === NONE) {
                        if (selected[0]) onToggleUpfit(selected[0].id);
                      } else {
                        onToggleUpfit(value as string);
                      }
                    }}
                  >
                    <DropdownMenuRadioItem
                      value={NONE}
                      closeOnClick
                      className={menuItemClassName}
                    >
                      None
                    </DropdownMenuRadioItem>
                    {items.map((upfit) => (
                      <DropdownMenuRadioItem
                        key={upfit.id}
                        value={upfit.id}
                        closeOnClick
                        className={menuItemClassName}
                      >
                        {optionLabel(upfit)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                ) : (
                  items.map((upfit) => (
                    <DropdownMenuCheckboxItem
                      key={upfit.id}
                      checked={installed.has(upfit.id)}
                      onCheckedChange={() => onToggleUpfit(upfit.id)}
                      className={menuItemClassName}
                    >
                      {optionLabel(upfit)}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
