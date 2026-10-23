import { notFound } from "next/navigation";
import PosterStage from "./PosterStage";

// Dev-only: scripts/render-hero-posters.mjs screenshots this page.
export default async function Page({ searchParams }: PageProps<"/dev/hero-poster">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { theme } = await searchParams;
  return <PosterStage theme={theme === "dark" ? "dark" : "light"} />;
}
