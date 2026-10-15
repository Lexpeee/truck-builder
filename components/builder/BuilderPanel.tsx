"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ChevronDown, Info, X } from "lucide-react";
import type { ReactNode } from "react";

/** Radio value for "no upfit installed" in an exclusive category. */
const NONE = "__none__";

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

/** Name plus the side effects of picking it, used inside menu items. */
function OptionLabel({ name, hint }: { name: string; hint?: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="font-medium">{name}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </span>
  );
}

function Field({
  title,
  aside,
  value,
  children,
}: {
  title: string;
  aside?: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
        {aside && <span className="font-normal normal-case">{aside}</span>}
      </h2>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-2 text-left text-sm font-semibold transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-primary">
          <span className="truncate">{value}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-(--anchor-width) rounded-xl p-1.5">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
}

const itemClassName = "rounded-lg py-2";

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
      <div className="flex flex-col gap-5 p-5">
        <Field title="Vehicle" value={getVehicle(build.vehicleId)?.name ?? ""}>
          <DropdownMenuRadioGroup
            value={build.vehicleId}
            onValueChange={(id) => onChangeVehicle(id as string)}
          >
            {VEHICLES.map((v) => (
              <DropdownMenuRadioItem
                key={v.id}
                value={v.id}
                closeOnClick
                className={itemClassName}
              >
                <OptionLabel name={v.name} />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </Field>

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
          const selected = items.filter((u) => installed.has(u.id));
          const label = selected.length
            ? nameList(selected.map((u) => u.id))
            : "None";

          return (
            <Field
              key={category.id}
              title={category.label}
              aside={category.exclusive ? "Choose one" : "Choose any"}
              value={label}
            >
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
                    className={itemClassName}
                  >
                    <OptionLabel name="None" />
                  </DropdownMenuRadioItem>
                  {items.map((upfit) => (
                    <DropdownMenuRadioItem
                      key={upfit.id}
                      value={upfit.id}
                      closeOnClick
                      className={itemClassName}
                    >
                      <OptionLabel
                        name={upfit.name}
                        hint={upfitHint(build, upfit, installed.has(upfit.id))}
                      />
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              ) : (
                items.map((upfit) => (
                  <DropdownMenuCheckboxItem
                    key={upfit.id}
                    checked={installed.has(upfit.id)}
                    onCheckedChange={() => onToggleUpfit(upfit.id)}
                    className={itemClassName}
                  >
                    <OptionLabel
                      name={upfit.name}
                      hint={upfitHint(build, upfit, installed.has(upfit.id))}
                    />
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </Field>
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
