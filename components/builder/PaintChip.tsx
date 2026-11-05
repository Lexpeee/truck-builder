import { cn } from "@/lib/utils";

/** A small sample of a paint color. Always shown next to the color's name, never alone. */
export default function PaintChip({ hex, className }: { hex: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-5 shrink-0 rounded-full border border-black/20 [print-color-adjust:exact]",
        className,
      )}
      style={{ backgroundColor: hex }}
    />
  );
}
