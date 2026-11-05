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
import { useBuilderStore } from "@/lib/builder-store";
import {
  CATEGORIES,
  VEHICLES,
  getUpfit,
  getVehicle,
  upfitsForVehicle,
  type Upfit,
} from "@/lib/catalog";
import SubmitBuildDialog from "@/components/builder/SubmitBuildDialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, CircleCheck, Info, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

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
      <span className="text-lg font-medium">{name}</span>
      {hint && <span className="text-base text-muted-foreground">{hint}</span>}
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
      <h2 className="mb-2 flex items-baseline justify-between text-base font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
        {aside && <span className="font-normal normal-case">{aside}</span>}
      </h2>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-2 text-left text-lg font-semibold transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-primary">
          <span className="truncate">{value}</span>
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-(--anchor-width) rounded-xl p-1.5">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
}

const itemClassName = "min-h-12 rounded-lg py-2";

/** How long the "quote sent" confirmation stays visible. */
const QUOTE_SENT_MS = 8000;

export default function BuilderPanel() {
  const build = useBuilderStore((s) => s.build);
  const notices = useBuilderStore((s) => s.notices);
  const onChangeVehicle = useBuilderStore((s) => s.changeVehicle);
  const onToggleUpfit = useBuilderStore((s) => s.toggleUpfit);
  const onDismissNotices = useBuilderStore((s) => s.dismissNotices);
  const available = upfitsForVehicle(build.vehicleId);
  const installed = new Set(build.upfitIds);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);

  useEffect(() => {
    if (!quoteSent) return;
    const id = setTimeout(() => setQuoteSent(false), QUOTE_SENT_MS);
    return () => clearTimeout(id);
  }, [quoteSent]);

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
          <Alert role="status" className="border-primary/30 bg-primary/5 pr-14 text-base">
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
              className="absolute top-0 right-0 flex size-12 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
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
        {quoteSent && (
          <Alert role="status" className="mb-4 border-primary/30 bg-primary/5 pr-14 text-base">
            <CircleCheck className="text-primary" />
            <AlertDescription>
              Quote request sent. Our team will be in touch.
            </AlertDescription>
            <button
              onClick={() => setQuoteSent(false)}
              aria-label="Dismiss"
              className="absolute top-0 right-0 flex size-12 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </Alert>
        )}
        <div className="flex flex-row gap-2 justify-between items-center">
          <div>
            <h2 className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
              Your build
            </h2>
            <p className="mt-1 text-lg font-bold">
              {getVehicle(build.vehicleId)?.name}
            </p>
            <p className="text-base text-muted-foreground">
              {build.upfitIds.length
                ? nameList(build.upfitIds)
                : "Stock vehicle, no upfits."}
            </p>
          </div>
          <Button onClick={() => setSubmitOpen(true)} className="h-12 px-5 text-base">Submit New Build</Button>
        </div>
        <SubmitBuildDialog
          open={submitOpen}
          onOpenChange={setSubmitOpen}
          onSubmitted={() => setQuoteSent(true)}
        />
      </section>
    </div>
  );
}
