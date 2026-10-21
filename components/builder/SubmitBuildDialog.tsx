"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Build } from "@/lib/builder";
import { getCategory, getUpfit, getVehicle } from "@/lib/catalog";
import { submitBuild, type CustomerDetails } from "@/lib/submit-build";
import { useState, type FormEvent } from "react";

type FieldSpec = {
  name: keyof CustomerDetails;
  label: string;
  type?: string;
  autoComplete?: string;
  optional?: boolean;
  /** Spans both columns on wider screens. */
  wide?: boolean;
};

const CONTACT_FIELDS: FieldSpec[] = [
  { name: "firstName", label: "First name", autoComplete: "given-name" },
  { name: "lastName", label: "Last name", autoComplete: "family-name" },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
  {
    name: "email",
    label: "Email address",
    type: "email",
    autoComplete: "email",
  },
  { name: "companyName", label: "Company name", autoComplete: "organization" },
  { name: "industry", label: "Industry" },
  { name: "purchaseMethod", label: "Purchase method" },
  { name: "purchaseTime", label: "Purchase time" },
];

const ADDRESS_FIELDS: FieldSpec[] = [
  {
    name: "addressLine1",
    label: "Address line 1",
    autoComplete: "address-line1",
    wide: true,
  },
  {
    name: "addressLine2",
    label: "Address line 2",
    autoComplete: "address-line2",
    optional: true,
    wide: true,
  },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
  { name: "zipCode", label: "Zip code", autoComplete: "postal-code" },
  { name: "country", label: "Country", autoComplete: "country-name" },
];

const CALLBACK_FIELD: FieldSpec = {
  name: "callbackTime",
  label: "Best callback time",
  wide: true,
};

function TextField({
  name,
  label,
  type,
  autoComplete,
  optional,
  wide,
}: FieldSpec) {
  return (
    <label className={wide ? "sm:col-span-2" : undefined}>
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </span>
      <Input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={!optional}
      />
    </label>
  );
}

function BuildSummary({ build }: { build: Build }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Your build
      </h3>
      <p className="mt-2 font-bold">{getVehicle(build.vehicleId)?.name}</p>
      {build.upfitIds.length ? (
        <ul className="mt-2 divide-y text-sm">
          {build.upfitIds.map((id) => {
            const upfit = getUpfit(id);
            return (
              <li key={id} className="flex justify-between gap-4 py-1.5">
                <span>{upfit?.name ?? id}</span>
                <span className="text-muted-foreground">
                  {upfit && getCategory(upfit.category).label}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          Stock vehicle, no upfits.
        </p>
      )}
    </section>
  );
}

/** Mounted only while the dialog is open, so it starts fresh every time. */
function SubmitBuildForm({
  build,
  onClose,
}: {
  build: Build;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState(false);

  if (status === "done") {
    return (
      <div className="mt-6">
        <p className="text-sm text-muted-foreground">
          Thanks, we received your build. Our team will be in touch.
        </p>
        <Button className="mt-6 h-10 px-5" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const customer = Object.fromEntries(
      new FormData(e.currentTarget),
    ) as CustomerDetails;
    // setStatus("submitting");
    setError(false);
    try {
      await submitBuild({
        build: {
          vehicle: getVehicle(build.vehicleId)?.name ?? build.vehicleId,
          upfits: build.upfitIds.map((id) => getUpfit(id)?.name ?? id),
        },
        customer: {
          ...customer, 
          deliveryAddress: `${customer.addressLine1}${customer.addressLine2 ? `, ${customer.addressLine2}` : ""}, ${customer.city}, ${customer.state} ${customer.zipCode}, ${customer.country}`,  
        },
      });
      // setStatus("done");
    } catch {
      setError(true);
      // setStatus("idle");
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-6">
      <BuildSummary build={build} />

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your details
        </legend>
        {CONTACT_FIELDS.map((f) => (
          <TextField key={f.name} {...f} />
        ))}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Delivery address
        </legend>
        {ADDRESS_FIELDS.map((f) => (
          <TextField key={f.name} {...f} />
        ))}
      </fieldset>

      <fieldset className="grid gap-4">
        <TextField {...CALLBACK_FIELD} wide={false} />
      </fieldset>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            Something went wrong sending your build. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-10 px-5"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-10 px-5"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Submitting…" : "Submit build"}
        </Button>
      </div>
    </form>
  );
}

export default function SubmitBuildDialog({
  build,
  open,
  onOpenChange,
}: {
  build: Build;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Submit your build</DialogTitle>
        <DialogDescription>
          Review your build and tell us how to reach you.
        </DialogDescription>
        <SubmitBuildForm build={build} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
