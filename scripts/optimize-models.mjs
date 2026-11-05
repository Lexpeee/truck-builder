// Brings the catalog GLBs in public/models/ in line with docs/3D-MODELING-GUIDELINES.md
// and reports each against its budgets. Rewrites the files in place (git is the backup).
//   npm run models:optimize   convert and report
//   npm run models:check      report only; exits 1 if any model is over budget
import { readFileSync, statSync } from "node:fs";
import { NodeIO, ImageUtils } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  flatten,
  getBounds,
  join,
  meshopt,
  metalRough,
  prune,
  textureCompress,
} from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
import { UPFITS, VEHICLES } from "../lib/catalog.ts";

// §2 triangle and material budgets, §3 texture caps. Keyed by role.
const BUDGETS = {
  chassis: { triangles: 80_000, materials: 15, texture: 2048 },
  body: { triangles: 30_000, materials: 6, texture: 1024 },
  rack: { triangles: 15_000, materials: 6, texture: 1024 },
  bumper: { triangles: 5_000, materials: 6, texture: 1024 },
};

const checkOnly = process.argv.includes("--check");
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const models = [
  ...VEHICLES.map((v) => ({ file: v.fileName, role: "chassis" })),
  ...UPFITS.map((u) => ({ file: u.fileName, role: u.category })),
];

function report(doc, path, role) {
  const root = doc.getRoot();
  const budget = BUDGETS[role];
  let triangles = 0;
  let drawCalls = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMode() !== 4) continue;
      const count = (prim.getIndices() ?? prim.getAttribute("POSITION")).getCount();
      triangles += count / 3;
      drawCalls++;
    }
  }
  const materials = root.listMaterials().length;
  const texture = Math.max(
    0,
    ...root.listTextures().map((t) => Math.max(...(ImageUtils.getSize(t.getImage(), t.getMimeType()) ?? [0]))),
  );
  const specGloss = root
    .listExtensionsUsed()
    .some((e) => e.extensionName === "KHR_materials_pbrSpecularGlossiness");
  // getBounds ignores EXT_mesh_gpu_instancing transforms, so measure the
  // non-instanced nodes only (instances here are small repeated parts).
  const minY = Math.min(
    ...root
      .listNodes()
      .filter((n) => n.getMesh() && !n.getExtension("EXT_mesh_gpu_instancing"))
      .map((n) => getBounds(n).min[1]),
  );
  const problems = [
    triangles > budget.triangles && `triangles ${Math.round(triangles)} > ${budget.triangles}`,
    materials > budget.materials && `materials ${materials} > ${budget.materials}`,
    texture > budget.texture && `texture ${texture}px > ${budget.texture}px`,
    specGloss && "uses spec/gloss materials",
    // §2: origin at ground level, so the lowest point sits at y = 0.
    Math.abs(minY) > 0.01 && `lowest point at y = ${minY.toFixed(3)} m, not 0`,
  ].filter(Boolean);
  const kb = Math.round(statSync(path).size / 1024);
  console.log(
    `${problems.length ? "FAIL" : "ok  "} ${role.padEnd(7)} ${path.split("/").pop()}\n` +
      `     ${Math.round(triangles)} tris · ${materials} materials · ${drawCalls} draw calls · ` +
      `${texture}px max texture · ${kb} KB` +
      problems.map((p) => `\n     - ${p}`).join(""),
  );
  return problems.length === 0;
}

let allOk = true;
for (const { file, role } of models) {
  const path = `public/models/${file}`;
  const doc = await io.readBinary(readFileSync(path));
  if (!checkOnly) {
    await doc.transform(
      // §3: PBR metal/rough only. three.js no longer reads spec/gloss at all.
      metalRough(),
      dedup(),
      // §2 draw calls: merge parts that share a material and never move separately.
      flatten(),
      join(),
      textureCompress({
        encoder: sharp,
        targetFormat: "webp",
        resize: [BUDGETS[role].texture, BUDGETS[role].texture],
      }),
      prune(),
      // §1 light files. drei's useGLTF decodes EXT_meshopt_compression by default.
      meshopt({ encoder: MeshoptEncoder, level: "medium" }),
    );
    await io.write(path, doc);
  }
  allOk = report(doc, path, role) && allOk;
}
if (checkOnly && !allOk) process.exit(1);
