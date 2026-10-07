import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VEHICLES } from "@/lib/catalog";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center dark:bg-black">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        New Work Trucks
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        Build your work truck in 3D
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Pick a chassis from {VEHICLES.length} available vehicles, then add
        bodies, racks, and bumpers to see your truck come together in
        real time.
      </p>
      <Button
        size="lg"
        className="mt-8 h-11 px-6 text-base"
        render={<Link href="/builder" />}
      >
        Start building
      </Button>
    </div>
  );
}
