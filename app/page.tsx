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
import ShowroomHero from "@/components/hero/ShowroomHero";
import { buttonVariants } from "@/components/ui/button";
import { VEHICLES } from "@/lib/catalog";
import { cn } from "@/lib/utils";
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

export default async function Home({ searchParams }: PageProps<"/">) {
  // Temporary: ?heroTheme=dark|light to compare themes in preview.
  const { heroTheme } = await searchParams;
  const theme = heroTheme === "dark" ? "dark" : "light";

  return (
    <main className="flex-1 overflow-x-clip">
      <ShowroomHero theme={theme} />
    </main>
  );
}
