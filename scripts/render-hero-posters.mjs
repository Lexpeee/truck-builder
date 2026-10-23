// Dev-only: renders the hero scene once per theme and saves transparent WebPs
// to public/hero/. Needs `npm run dev` running and Playwright's Chromium:
//   npx --yes playwright install chromium
//   npx --yes -p playwright node scripts/render-hero-posters.mjs
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");
const base = process.env.BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
for (const theme of ["dark", "light"]) {
  const page = await browser.newPage({ viewport: { width: 2000, height: 940 } });
  page.on("console", (m) => m.type() === "error" && console.error(m.text()));
  await page.goto(`${base}/dev/hero-poster?theme=${theme}`);
  await page.waitForSelector("[data-poster-ready]", { timeout: 120_000 });
  const png = await page.screenshot({ omitBackground: true });
  await sharp(png).webp({ quality: 88, alphaQuality: 100 }).toFile(`public/hero/showroom-${theme}.webp`);
  console.log(`wrote public/hero/showroom-${theme}.webp`);
  await page.close();
}
await browser.close();
