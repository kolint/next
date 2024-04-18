import { readJsonFile, writeJsonFile } from "@nx/devkit";
import { relative, resolve } from "node:path";
import { sortPackageJson } from "sort-package-json";

import execa = require("execa");
import slash = require("slash");

export async function listPackages(root: string) {
  const { stdout } = await execa("pnpm", ["m", "ls", "--json", "--depth=1"], {
    cwd: root,
  });
  const packages = JSON.parse(stdout);
  return packages;
}

export async function generatePackage({
  root,
  projectRoot,
  overrides,
  outputPath,
}: {
  root: string;
  projectRoot: string;
  overrides?: any;
  outputPath: string;
}) {
  let success = true;

  let _packages: any[];
  const getPackages = async () => {
    return (_packages ??= await listPackages(root));
  };

  // Get root package.json
  const rootPackageJsonPath = resolve(root, "package.json");
  const rootPackageJson = readJsonFile(rootPackageJsonPath);
  // Validate root package.json
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

  // Get package.json
  const packageJsonPath = resolve(projectRoot, "package.json");
  const relativePackageJsonPath = relative(root, packageJsonPath);
  const packageJson = readJsonFile(packageJsonPath);
  // Validate package.json
  if (!packageJson.private && !packageJson.version) {
    success = false;
    console.error(`"${relativePackageJsonPath}" is missing version field.`);
  }

  // Transform package.json
  delete packageJson.nx;
  delete packageJson.pnpm;
  packageJson.repository ??= {
    ...rootPackageJson.repository,
    directory: slash(relative(root, projectRoot)),
  };
  packageJson.license ??= rootPackageJson.license;
  if (overrides) {
    Object.assign(packageJson, overrides);
  }

  // Transform package.json dependencies
  const dependencyObjects = [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.peerDependencies,
    packageJson.optionalDependencies,
  ].filter(Boolean);
  for (const object of dependencyObjects) {
    for (const [key, value] of Object.entries(
      object as Record<string, string>,
    )) {
      if (value.startsWith("workspace:")) {
        const range = value.slice("workspace:".length);

        const prefixMap = {
          "*": "",
          "~": "~",
          "^": "^",
        };

        if (Object.hasOwn(prefixMap, range)) {
          const prefix = prefixMap[range as keyof typeof prefixMap];
          const packages = await getPackages();
          const pkg = packages.find((pkg) => pkg.name === key);

          if (pkg) {
            object[key] = prefix + pkg.version;
          } else {
            success = false;
            console.error(`Package '${key}' does not exist in this workspace.`);
            object[key] = "*";
          }
        } else {
          object[key] = range;
        }
      }
    }
  }

  // Write dist package.json
  writeJsonFile(
    resolve(outputPath, "package.json"),
    sortPackageJson(packageJson),
  );

  return success;
}
