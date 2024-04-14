import { PackageGeneratorSchema } from "./schema";
import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Generator,
  Tree,
} from "@nx/devkit";
import * as path from "path";

const generator: Generator<PackageGeneratorSchema> = async (
  tree: Tree,
  options,
) => {
  const projectRoot = `packages/${options.name}`;
  addProjectConfiguration(tree, `@kolint/${options.name}`, {
    root: projectRoot,
    projectType: "library",
    sourceRoot: `{projectRoot}/src`,
    targets: {
      build: {},
      test: {},
      lint: {},
    },
  });
  generateFiles(tree, path.join(__dirname, "files"), projectRoot, options);
  await formatFiles(tree);
};

export default generator;
