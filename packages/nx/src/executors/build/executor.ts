import { TsupExecutorSchema } from "./schema";
import { Executor, readJsonFile, writeJsonFile } from "@nx/devkit";
import { copyAssets } from "@nx/js";
import { calculateProjectBuildableDependencies } from "@nx/js/src/utils/buildable-libs-utils";
import { rm } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { sortPackageJson } from "sort-package-json";
import { Options, build } from "tsup";

import slash = require("slash");

const DEFAULT_CONFIG: Options = {
  format: "esm",
};

const executor: Executor<TsupExecutorSchema> = async (options, context) => {
  let success = true;

  const project =
    context.projectsConfigurations!.projects![context.projectName!]!;
  const projectRoot = resolve(context.root, project.root);
  const relativeProjectRoot = relative(context.root, projectRoot);
  const outputPath =
    options.outputPath ?? resolve(context.root, "dist", relativeProjectRoot);

  // Avoid cleaning the outputPath if misconfigured.
  if (outputPath.includes("dist") || outputPath.includes("build")) {
    await rm(outputPath, { force: true, recursive: true });
  }

  const configs = Array.isArray(options.tsup)
    ? options.tsup
    : [options.tsup ?? {}];

  const results = await Promise.allSettled(
    configs.map((config) =>
      build({
        ...DEFAULT_CONFIG,
        entry: options.entry
          ? Array.isArray(options.entry)
            ? options.entry
            : [options.entry]
          : [resolve(projectRoot, "src/index.ts")],
        outDir: outputPath,
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

  const { dependencies } = calculateProjectBuildableDependencies(
    context.taskGraph,
    context.projectGraph!,
    context.root,
    context.projectName!,
    context.targetName!,
    context.configurationName!,
  );

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

  packageJson.types = options.types;
  packageJson.exports = options.exports;

  for (const dependency of dependencies) {
    if (
      !packageJson.dependencies[dependency.name] &&
      !packageJson.peerDependencies[dependency.name] &&
      !packageJson.optionalDependencies[dependency.name]
    ) {
      success = false;
      console.error(
        `"${relativePackageJsonPath}" is missing production dependency "${dependency.name}".`,
      );
    }
  }

  if (!packageJson.private && !packageJson.version) {
    success = false;
    console.error(`"${relativePackageJsonPath}" is missing version field.`);
  }

  if (options.includeDevDependencies?.length) {
    packageJson.devDependencies = Object.fromEntries(
      options.includeDevDependencies
        .filter((name) => {
          const isDefined = !!packageJson.devDependencies[name];
          if (!isDefined) {
            success = false;
            console.error(
              `"${relativePackageJsonPath}" is missing development dependency "${name}".`,
            );
          }
          return isDefined;
        })
        .map((name) => [name, packageJson.devDependencies[name]]),
    );
  } else {
    delete packageJson.devDependencies;
  }

  packageJson.repository ??= {
    ...rootPackageJson.repository,
    directory: slash(relative(context.root, projectRoot)),
  };
  packageJson.license ??= rootPackageJson.license;

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
