// Makes freshly exported catalog GLBs work in the builder. Run after replacing a file in
// public/models/; safe to repeat (git is the backup). Rewrites the files in place.
//   npm run models:calibrate
// 1. Spec/gloss -> metal/rough: three.js ignores spec/gloss, so colors would be lost.
// 2. Names each model's paint material: the builder recolors by name (lib/paint.ts).
// 3. Gives material-less parts a silver metal: three.js would otherwise render them with its
//    fully metallic, fully rough default, which reads as black in the studio lighting.
// Budgets (triangles, materials) are not touched: see `npm run models:check`.
import { readFileSync, writeFileSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { metalRough } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { PAINT_MATERIAL } from "../lib/paint.ts";

const { vehicle, upfit } = PAINT_MATERIAL;
/** File -> the exporter's name for the material that carries the paint color. Unpainted models: null. */
const PAINT_SOURCE = {
  "RAM 2500HD CC.glb": [vehicle, "Paint metallic"],
  "Chevrolet express 3500.glb": [vehicle, "[0128_White]"],
  "RAM 2500HD CC 696j Body.glb": [upfit, "Material1"],
  "RAM 2500HD CC 696j Utility Rack.glb": [upfit, "Material5"],
  "Chev express 3500 - KUV129SU.glb": [upfit, "Material1"],
  "Chev express 3500 - KUV129SU - Tri wing ladder rack.glb": [upfit, "<auto>"],
  "RAM 2500HD CC 696j Hitch Recess Bumper.glb": null,
  "RAM 2500HD CC 696j Step Bumper.glb": null,
  "RAM 2500HD CC 696j Straight Bumper.glb": null,
};
const METAL = { name: "unpainted-metal", color: [0.78, 0.8, 0.83, 1], roughness: 0.4 };

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });

for (const [file, paint] of Object.entries(PAINT_SOURCE)) {
  const path = `public/models/${file}`;
  const doc = await io.readBinary(readFileSync(path));
  await doc.transform(metalRough());
  const notes = [];

  if (paint) {
    const [name, source] = paint;
    const mats = doc.getRoot().listMaterials();
    if (mats.some((m) => m.getName() === name)) notes.push(`"${name}" already named`);
    else {
      const found = mats.filter((m) => m.getName() === source);
      if (found.length === 1) {
        found[0].setName(name);
        notes.push(`"${source}" -> "${name}"`);
      } else notes.push(`!! no single "${source}" to name "${name}" (found ${found.length})`);
    }
  }

  let bare = 0;
  let metal = null;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMaterial()) continue;
      metal ??= doc
        .createMaterial(METAL.name)
        .setBaseColorFactor(METAL.color)
        .setMetallicFactor(1)
        .setRoughnessFactor(METAL.roughness);
      prim.setMaterial(metal);
      bare++;
    }
  }
  if (bare) notes.push(`${bare} material-less parts -> "${METAL.name}"`);

  writeFileSync(path, await io.writeBinary(doc));
  console.log(`${file}\n   ${notes.join("; ") || "nothing to do"}`);
}
