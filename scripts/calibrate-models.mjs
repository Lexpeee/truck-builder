// Makes freshly exported catalog GLBs work in the builder. Run after replacing a file in
// public/models/; safe to repeat (git is the backup). Rewrites the files in place.
//   npm run models:calibrate
// 1. Spec/gloss -> metal/rough: three.js ignores spec/gloss, so colors would be lost.
// 2. Names each model's paint material: the builder recolors by name (lib/paint.ts).
// 3. Parts with no material: three.js would render them with its fully metallic, fully
//    rough default, which reads as black in the studio lighting. In a painted body they
//    are its panels and join the paint; elsewhere they get a silver metal.
// 4. Door skins the exporter left as black plastic (`skins`) join the paint.
// Budgets (triangles, materials) are not touched: see `npm run models:check`.
import { readFileSync, writeFileSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds, metalRough } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { PAINT_MATERIAL } from "../lib/paint.ts";

const { vehicle, upfit } = PAINT_MATERIAL;
/**
 * Per file: `paint` is [name, the exporter's name for the material carrying the paint color];
 * `bare` says where material-less parts go ("paint" or the default "metal");
 * `skins` moves parts of a material into the paint when `test(size)` holds, size being
 * the part's [x, y, z] extent in metres. Unpainted models have no `paint`.
 */
const MODELS = {
  "RAM 2500HD CC.glb": {
    paint: [vehicle, "Paint metallic"],
    // Cab doors and side panels: tall, thin slabs; the exporter made them "plastico".
    skins: { from: "plastico", test: ([x, y, z]) => x < 0.4 && y > 1.1 && z > 0.9 },
  },
  "Chevrolet express 3500.glb": { paint: [vehicle, "[0128_White]"] },
  "RAM 2500HD CC 696j Body.glb": { paint: [upfit, "Material1"], bare: "paint" },
  "RAM 2500HD CC 696j Utility Rack.glb": { paint: [upfit, "Material5"] },
  "Chev express 3500 - KUV129SU.glb": { paint: [upfit, "Material1"], bare: "paint" },
  "Chev express 3500 - KUV129SU - Tri wing ladder rack.glb": { paint: [upfit, "<auto>"] },
  "RAM 2500HD CC 696j Hitch Recess Bumper.glb": {},
  "RAM 2500HD CC 696j Step Bumper.glb": {},
  "RAM 2500HD CC 696j Straight Bumper.glb": {},
};
const METAL = { name: "unpainted-metal", color: [0.78, 0.8, 0.83, 1], roughness: 0.4 };

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });

for (const [file, { paint, bare, skins }] of Object.entries(MODELS)) {
  const path = `public/models/${file}`;
  const doc = await io.readBinary(readFileSync(path));
  await doc.transform(metalRough());
  const root = doc.getRoot();
  const notes = [];

  let paintMat = null;
  if (paint) {
    const [name, source] = paint;
    paintMat = root.listMaterials().find((m) => m.getName() === name) ?? null;
    if (paintMat) notes.push(`"${name}" already named`);
    else {
      const found = root.listMaterials().filter((m) => m.getName() === source);
      if (found.length === 1) {
        paintMat = found[0].setName(name);
        notes.push(`"${source}" -> "${name}"`);
      } else notes.push(`!! no single "${source}" to name "${name}" (found ${found.length})`);
    }
  }

  // Parts of one mesh node each; a node may carry several parts.
  const prims = root.listNodes().flatMap((node) => {
    const mesh = node.getMesh();
    if (!mesh) return [];
    const b = getBounds(node);
    const size = [0, 1, 2].map((i) => b.max[i] - b.min[i]);
    return mesh.listPrimitives().map((prim) => ({ prim, size }));
  });

  if (skins && paintMat) {
    let n = 0;
    for (const { prim, size } of prims) {
      if (prim.getMaterial()?.getName() === skins.from && skins.test(size)) {
        prim.setMaterial(paintMat);
        n++;
      }
    }
    if (n) notes.push(`${n} "${skins.from}" door skins -> "${paintMat.getName()}"`);
  }

  // Material-less parts (and ones an earlier run gave the silver metal).
  const toPaint = bare === "paint" && paintMat;
  let metal = null;
  let count = 0;
  for (const { prim } of prims) {
    const name = prim.getMaterial()?.getName();
    if (name && name !== METAL.name) continue;
    if (toPaint) prim.setMaterial(paintMat);
    else if (!name) {
      metal ??= doc
        .createMaterial(METAL.name)
        .setBaseColorFactor(METAL.color)
        .setMetallicFactor(1)
        .setRoughnessFactor(METAL.roughness);
      prim.setMaterial(metal);
    } else continue;
    count++;
  }
  if (count) notes.push(`${count} material-less parts -> "${toPaint ? paintMat.getName() : METAL.name}"`);

  writeFileSync(path, await io.writeBinary(doc));
  console.log(`${file}\n   ${notes.join("; ") || "nothing to do"}`);
}
