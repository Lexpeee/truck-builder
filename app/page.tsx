import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
  ShieldCheck,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { VEHICLES } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import ramTruck from "@/public/images/truck-ram-2500hd.webp";
import expressVan from "@/public/images/van-chevy-express.webp";

const pill = (variant: "default" | "secondary" | "outline" = "default") =>
  cn(
    buttonVariants({ variant, size: "lg" }),
    "h-12 rounded-full px-7 text-base",
  );

const services: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Truck,
    title: "Trucks and vans",
    text: "Light-, medium-, and heavy-duty trucks and vans from major work-truck brands.",
  },
  {
    icon: Wrench,
    title: "Upfits and configurations",
    text: "Specialized bodies, racks, and bumpers so each vehicle is ready for its job.",
  },
  {
    icon: Banknote,
    title: "Financing and leasing",
    text: "Flexible options when you add or replace vehicles.",
  },
  {
    icon: ShieldCheck,
    title: "Fleet programs",
    text: "Fleet programs that include maintenance and warranty coverage.",
  },
];

const upfitPoints = [
  "Service bodies and enclosed van bodies",
  "Ladder racks and utility racks",
  "Step, straight, and hitch-recess bumpers",
];

const steps = [
  {
    title: "Choose a vehicle",
    text: "Start with a chassis that suits your job, budget, and fleet.",
  },
  {
    title: "Add upfits",
    text: "Add bodies, racks, and bumpers and see them on the truck in 3D.",
  },
  {
    title: "Get help from our team",
    text: "We review your build and help you find the right fit.",
  },
];

const stats = [
  { value: "30+", label: "Years of automotive experience" },
  { value: "3", label: "Duty classes: light, medium, and heavy" },
  { value: "U.S.", label: "Businesses served nationwide" },
];

const faqs = [
  {
    q: "What kinds of vehicles do you offer?",
    a: "Light-, medium-, and heavy-duty trucks, plus vans from major work-truck brands.",
  },
  {
    q: "Can you help me choose upfits?",
    a: "Yes. Our team helps you pick specialized upfits and configurations so the vehicle is ready for the work it needs to do. You can try them out in the builder first.",
  },
  {
    q: "Do you offer financing or leasing?",
    a: "Yes. Financing and leasing options give you flexibility when you add or replace vehicles.",
  },
  {
    q: "What do fleet programs include?",
    a: "Our fleet programs include maintenance and warranty coverage.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  className,
}: {
  eyebrow: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex-1 overflow-x-clip">
      {/* Hero */}
      <section className="relative">
        {/* Blue field with a diagonal edge, as in the reference layouts. */}
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 hidden w-[55%] bg-primary [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%)] lg:block"
        />

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-extrabold"
          >
            <div className="p-2 bg-primary ">
              <Image
                src="/logo.webp"
                alt="New Work Trucks"
                width={80}
                height={80}
              />
            </div>
          </Link>
          <nav className="flex items-center gap-8 text-sm font-medium lg:text-primary-foreground">
            <a href="#services" className="hidden hover:underline md:inline">
              Services
            </a>
            <a href="#upfits" className="hidden hover:underline md:inline">
              Upfits
            </a>
            <a href="#faq" className="hidden hover:underline md:inline">
              FAQ
            </a>
            <Link
              href="/builder"
              className={cn(
                buttonVariants(),
                "h-10 rounded-full px-5 lg:bg-white lg:text-primary lg:hover:bg-white/90",
              )}
            >
              Build a truck
            </Link>
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-28 pt-10 lg:grid-cols-[1fr_1.15fr] lg:pb-36 lg:pt-16">
          <div>
            <p className="font-semibold text-primary">
              Work trucks for businesses across the U.S.
            </p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Build the right work truck for the job.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Pick a vehicle, add the upfits your work needs, and see it in 3D.
              Then our team helps you find the right fit for your budget and
              fleet.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/builder" className={pill()}>
                Start building <ArrowRight />
              </Link>
              <a href="#services" className={pill("outline")}>
                See what we offer
              </a>
            </div>
          </div>

          <div className="relative -mx-6 bg-primary px-6 py-10 lg:mx-0 lg:bg-transparent lg:p-0">
            <Image
              src={ramTruck}
              alt="RAM 2500HD crew cab with a 696J service body, utility rack, and step bumper"
              preload
              sizes="(min-width: 1024px) 640px, 100vw"
              className="relative w-full drop-shadow-[0_30px_30px_rgba(0,0,0,0.35)] lg:scale-110"
            />
          </div>
        </div>
      </section>

      {/* Services: cards overlap the bottom edge of the hero. */}
      <section id="services" className="relative z-10 -mt-16 scroll-mt-8 px-6">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-2xl bg-border shadow-xl sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-card p-8 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upfits */}
      <section
        id="upfits"
        className="mx-auto grid max-w-6xl scroll-mt-8 items-center gap-16 px-6 py-24 lg:grid-cols-2"
      >
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/10"
          />
          <div
            aria-hidden
            className="absolute inset-[12%] rounded-full bg-primary"
          />
          <Image
            src={expressVan}
            alt="Chevrolet Express 3500 with a KUV129SU service body and tri-wing ladder rack"
            sizes="(min-width: 1024px) 512px, 100vw"
            className="absolute top-1/2 left-1/2 w-[115%] max-w-none -translate-x-1/2 -translate-y-[40%] drop-shadow-[0_24px_24px_rgba(0,0,0,0.3)]"
          />
        </div>
        <div>
          <SectionHeading
            eyebrow="Upfits and configurations"
            title="Ready for the work it needs to do."
          />
          <p className="mt-5 text-muted-foreground">
            The right body and equipment matter as much as the chassis. Our team
            helps you choose specialized upfits, and the builder shows you
            exactly how they fit before you commit.
          </p>
          <ul className="mt-6 space-y-3">
            {upfitPoints.map((point) => (
              <li key={point} className="flex gap-3 font-medium">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <Link href="/builder" className={cn(pill(), "mt-8")}>
            Try upfits in 3D <ArrowRight />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading
            eyebrow="How it works"
            title="Build it online. Finish it with an expert."
            className="text-center"
          />
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-card p-8 shadow-sm">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            In the builder now: {VEHICLES.map((v) => v.name).join(" and ")}.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-10 rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-5xl font-extrabold">{s.value}</p>
              <p className="mt-2 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="mx-auto grid max-w-6xl scroll-mt-8 gap-12 px-6 pb-24 lg:grid-cols-[1fr_1.4fr]"
      >
        <div>
          <SectionHeading eyebrow="FAQ" title="Ready to work with our team?" />
          <p className="mt-5 text-muted-foreground">
            Backed by more than 30 years of automotive experience, we aim to
            make getting the right work vehicle simpler.
          </p>
        </div>
        <div className="divide-y rounded-2xl border">
          {faqs.map((f, i) => (
            <details key={f.q} open={i === 0} className="group px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Ready to add or replace a vehicle?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Start a build. We can help with upfits, financing, leasing, and
              fleet programs.
            </p>
          </div>
          <Link href="/builder" className={pill()}>
            Start building <ArrowRight />
          </Link>
        </div>
      </section>

      <footer className="bg-zinc-950 text-zinc-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-extrabold text-white"
          >
            <Image
              src="/images/logo.webp"
              alt="New Work Trucks"
              className="size-10"
              width={40}
              height={40}
            />
          </Link>
          <nav className="flex gap-6 text-sm">
            <a href="#services" className="hover:text-white">
              Services
            </a>
            <a href="#upfits" className="hover:text-white">
              Upfits
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
            <Link href="/builder" className="hover:text-white">
              Builder
            </Link>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-6 py-6 text-sm">
            © {new Date().getFullYear()} newworktrucks.com
          </p>
        </div>
      </footer>
    </main>
  );
}
