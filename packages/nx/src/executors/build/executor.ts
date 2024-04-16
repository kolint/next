import { TsupExecutorSchema } from "./schema";
import { Executor, readJsonFile, writeJsonFile } from "@nx/devkit";
import { copyAssets } from "@nx/js";
import { rm } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { sortPackageJson } from "sort-package-json";
import { build } from "tsup";

import slash = require("slash");

const executor: Executor<TsupExecutorSchema> = async (options, context) => {
  let success = true;

  const project =
    context.projectsConfigurations!.projects![context.projectName!]!;
  const projectRoot = resolve(context.root, project.root);
  // const relativeProjectRoot = relative(context.root, projectRoot);
  const outputPath = options.outputPath;

  // Avoid cleaning the outputPath if misconfigured.
  if (outputPath.includes("dist") || outputPath.includes("build")) {
    await rm(outputPath, { force: true, recursive: true });
  }

  const configs = Array.isArray(options.tsup) ? options.tsup : [options.tsup];

  const results = await Promise.allSettled(
    configs.map((config) =>
      build({
        // entry
        ...(options.entry && {
          entry: Array.isArray(options.entry) ? options.entry : [options.entry],
        }),

        format: options.format ?? "esm",
        outDir: outputPath,
        tsconfig: options.tsconfig,
        dts: options.declaration,
        sourcemap: options.sourceMap,
        skipNodeModulesBundle: true,

        ...config,
      }),
    ),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      success = false;
      console.error(result.reason.message);
    }
  }

  const rootPackageJsonPath = resolve(context.root, "package.json");
  const rootPackageJson = readJsonFile(rootPackageJsonPath);

  if (typeof rootPackageJson.repository !== "object") {
    success = false;
    console.error(`Workspace "package.json" is missing repository field.`);
    return { success };
  }

  if (!rootPackageJson.license) {
    success = false;
    console.error(`Workspace "package.json" is missing license field.`);
    return { success };
  }

  const packageJsonPath = resolve(projectRoot, "package.json");
  const relativePackageJsonPath = relative(context.root, packageJsonPath);
  const packageJson = readJsonFile(packageJsonPath);

  delete packageJson.nx;
  delete packageJson.pnpm;
  delete packageJson.devDependencies;

  if (!packageJson.private && !packageJson.version) {
    success = false;
    console.error(`"${relativePackageJsonPath}" is missing version field.`);
  }

  packageJson.repository ??= {
    ...rootPackageJson.repository,
    directory: slash(relative(context.root, projectRoot)),
  };
  packageJson.license ??= rootPackageJson.license;

  Object.assign(packageJson, options.package ?? {});

  writeJsonFile(
    resolve(outputPath, "package.json"),
    sortPackageJson(packageJson),
  );
  await copyAssets(
    {
      assets: options.assets ?? [],
      outputPath,
    },
    context,
  );

  return { success };
};

export default executor;
