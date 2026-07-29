import { readFile, writeFile } from "node:fs/promises";

const handler = new URL("../.open-next/server-functions/default/handler.mjs", import.meta.url);
const source = await readFile(handler, "utf8");
let replacements = 0;
const fixed = source.replace(/import\("([^"]+\.wasm)"\)/g, (match, path) => {
  const filename = path.endsWith("resvg.wasm") ? "resvg.wasm" :
    path.endsWith("yoga.wasm") ? "yoga.wasm" : null;
  if (!filename) return match;
  replacements += 1;
  return `import("./node_modules/next/dist/compiled/@vercel/og/${filename}")`;
});
if (replacements !== 4) {
  throw new Error(`Expected four Windows WASM imports, found ${replacements}.`);
}
await writeFile(handler, fixed, "utf8");
console.log(`Normalized ${replacements} OpenNext WASM imports.`);
