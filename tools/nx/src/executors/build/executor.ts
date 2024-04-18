import { buildPackage } from "../../lib/build";
import { generatePackage } from "../../lib/package-json";
import { type BuildExecutorSchema } from "./schema.js";
import { type Executor } from "@nx/devkit";
import { copyAssets } from "@nx/js";
import { resolve } from "node:path";

const executor: Executor<BuildExecutorSchema> = async (options, context) => {
  const project =
    context.projectsConfigurations!.projects![context.projectName!]!;
  const projectRoot = resolve(context.root, project.root);

  const results = await Promise.all([
    buildPackage({
      entry: options.entry,
      outputPath: options.outputPath,
      declaration: options.declaration,
      format: options.format,
      overrides: options.tsup,
      sourceMap: options.sourceMap,
      tsconfig: options.tsconfig,
    }),
    generatePackage({
      outputPath: options.outputPath,
      projectRoot,
      root: context.root,
      overrides: options.package,
    }),
  ]);

  await copyAssets(
    {
      assets: options.assets ?? [],
      outputPath: options.outputPath,
    },
    context,
  );

  return {
    success: results.every((success) => success),
  };
};

export default executor;
