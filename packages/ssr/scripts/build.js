import { parse } from "es-module-lexer";
import { globby } from "globby";
import MagicString from "magic-string";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
  rename,
} from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import slash from "slash";
import { build } from "tsup";

const OUTDIR = resolve("../../dist/packages/ssr");

await clean();

await Promise.all([
  Promise.all([
    copyFile("../../LICENSE", join(OUTDIR, "LICENSE")),
    copyFile("README.md", join(OUTDIR, "README.md")),
  ]).then(() => {
    console.log("Successfully copied static files.");
  }),
  generatePackage(),
  Promise.all([runNodeBuild(), runBrowserBuild()]).then(() =>
    moveDeclarationsToBuild(),
  ),
]);

async function clean() {
  await rm(OUTDIR, { recursive: true, force: true });
  await mkdir(join(OUTDIR, "bin"), { recursive: true });
}

async function generatePackage() {
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  pkg.devDependencies = Object.fromEntries(
    Object.entries(pkg.devDependencies).filter(([key]) =>
      pkg.publishConfig.includeDependencies.includes(key),
    ),
  );
  delete pkg.scripts;
  delete pkg.private;
  delete pkg.publishConfig;
  delete pkg.np;
  delete pkg.overrides;
  await writeFile(join(OUTDIR, "package.json"), JSON.stringify(pkg, null, 2));
  console.log("Successfully generated package.json!");
}

async function runNodeBuild() {
  await build({
    entry: {
      index: "src/lib/exports.ts",
      "bin/knockout-ssr": "src/cli/main.ts",
      "rollup/index": "src/rollup/plugin.ts",
      "vite/index": "src/vite/plugin.ts",
      "webpack/index": "src/webpack/loader.ts",
    },
    tsconfig: "tsconfig.node.json",
    platform: "node",
    outDir: OUTDIR,
    format: "esm",
    dts: true,
    external: [
      // not used
      "lightningcss",
    ],
    skipNodeModulesBundle: true,
    esbuildOptions: (options) => {
      options.chunkNames = "build/[name]-[hash]";
    },
  });

  console.log("Successfully built backend entries!");
}

async function runBrowserBuild() {
  await build({
    entry: {
      "runtime/index": "src/runtime/index.ts",
    },
    tsconfig: "tsconfig.web.json",
    platform: "browser",
    outDir: OUTDIR,
    format: "esm",
    skipNodeModulesBundle: true,
    esbuildOptions: (options) => {
      options.chunkNames = "build/[name]-[hash]";
    },
  });

  await rm(join(OUTDIR, "bin/knockout-ssr.d.ts"), { force: true });

  console.log("Successfully built browser runtime entries!");
}

async function moveDeclarationsToBuild() {
  const oldPaths = (
    await globby("**/*.d.ts", {
      cwd: OUTDIR,
      ignore: ["**/node_modules/**"],
      absolute: true,
    })
  ).filter((p) => /-[a-z0-9-_]{8,8}\.d\.ts$/i.test(p));

  const newPaths = await Promise.all(
    oldPaths.map(async (file) => {
      const hash = createHash("sha256")
        .update(basename(file))
        .digest("base64url")
        .slice(0, 8)
        .toUpperCase()
        .replace(/[-_]/, "Z");
      const name = `types-${hash}.d.ts`;
      const newPath = resolve(join(OUTDIR, "build"), name);
      await rename(file, newPath);
      return newPath;
    }),
  );

  const files = await globby(join(OUTDIR, "**/*.d.ts"), {
    ignore: ["**/node_modules/**"],
    absolute: true,
  });

  await Promise.all(
    files.map(async (file) => {
      const content = await readFile(file, "utf-8");
      const [imports] = parse(content);
      const magicString = new MagicString(content);
      for (const { n, s, e } of imports) {
        const i = oldPaths.findIndex((p) =>
          n.includes(basename(p).replace(".d.ts", "")),
        );
        if (i !== -1) {
          const newPath = newPaths[i];
          const rel = relative(dirname(file), newPath);
          const importPath = "./" + slash(rel.replace(".d.ts", ".js"));
          magicString.overwrite(s, e, importPath);
        }
      }
      await writeFile(file, magicString.toString());
    }),
  );

  console.log('Successfully moved declarations to "dist/build":');
  console.log(
    newPaths.map((p) => `  ${slash(relative(OUTDIR, p))}`).join("\n"),
  );
}
