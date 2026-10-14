"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { previewToggle, type Build } from "@/lib/builder";
import {
  CATEGORIES,
  VEHICLES,
  getUpfit,
  getVehicle,
  upfitsForVehicle,
  type Upfit,
} from "@/lib/catalog";
import { Check, Info, X } from "lucide-react";
import type { ReactNode } from "react";

const nameList = (ids: string[]) =>
  ids.map((id) => getUpfit(id)?.name ?? id).join(", ");

/** What picking an upfit implies, shown under its name before the click. */
const upfitHint = (build: Build, upfit: Upfit, isOn: boolean) => {
  const { adds, removes } = previewToggle(build, upfit.id);
  const effects = isOn
    ? [removes.length && `Also removes ${nameList(removes)}`]
    : [
        adds.length && `Also adds ${nameList(adds)}`,
        removes.length && `Replaces ${nameList(removes)}`,
      ];
  // Missing requirements already show up as "Also adds".
  const needs =
    !adds.length &&
    upfit.requires?.length &&
    `Requires ${nameList(upfit.requires)}`;
  return [needs, ...effects].filter(Boolean).join(" · ") || undefined;
};

/** A selectable card backed by a native radio or checkbox input. */
function Option({
  type,
  name,
  checked,
  onChange,
  label,
  hint,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  label: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/50 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center border-2 border-muted-foreground/40 text-primary-foreground peer-checked:border-primary peer-checked:bg-primary ${
          type === "radio" ? "rounded-full" : "rounded-md"
        }`}
      >
        <Check className="size-3 stroke-3" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

function Group({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-2 flex w-full items-baseline justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
        {aside && <span className="font-normal normal-case">{aside}</span>}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{children}</div>
    </fieldset>
  );
}

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
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-6 p-5">
        <Group title="Vehicle">
          {VEHICLES.map((v) => (
            <Option
              key={v.id}
              type="radio"
              name="vehicle"
              checked={build.vehicleId === v.id}
              onChange={() => onChangeVehicle(v.id)}
              label={v.name}
            />
          ))}
        </Group>

        {notices.length > 0 && (
          <Alert role="status" className="border-primary/30 bg-primary/5 pr-10">
            <Info className="text-primary" />
            <AlertDescription>
              <ul className="space-y-0.5">
                {notices.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </AlertDescription>
            <button
              onClick={onDismissNotices}
              aria-label="Dismiss"
              className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </Alert>
        )}

        {CATEGORIES.map((category) => {
          const items = available.filter((u) => u.category === category.id);
          if (!items.length) return null;
          const selected = items.find((u) => installed.has(u.id));

          return (
            <Group
              key={category.id}
              title={category.label}
              aside={category.exclusive ? "Choose one" : "Choose any"}
            >
              {category.exclusive && (
                <Option
                  type="radio"
                  name={category.id}
                  checked={!selected}
                  onChange={() => selected && onToggleUpfit(selected.id)}
                  label="None"
                />
              )}
              {items.map((upfit) => {
                const isOn = installed.has(upfit.id);
                return (
                  <Option
                    key={upfit.id}
                    type={category.exclusive ? "radio" : "checkbox"}
                    name={category.id}
                    checked={isOn}
                    onChange={() => onToggleUpfit(upfit.id)}
                    label={upfit.name}
                    hint={upfitHint(build, upfit, isOn)}
                  />
                );
              })}
            </Group>
          );
        })}
      </div>

      <section className="sticky bottom-0 mt-auto border-t bg-background/95 p-5 backdrop-blur">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your build
        </h2>
        <p className="mt-1 font-bold">{getVehicle(build.vehicleId)?.name}</p>
        <p className="text-sm text-muted-foreground">
          {build.upfitIds.length
            ? nameList(build.upfitIds)
            : "Stock vehicle, no upfits."}
        </p>
      </section>
    </div>
  );
}
