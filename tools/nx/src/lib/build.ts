import { type Options, build, type Format } from "tsup";

export async function buildPackage({
  outputPath,
  overrides,
  entry,
  declaration,
  format,
  sourceMap,
  tsconfig,
}: {
  outputPath: string;
  entry?:
    | string
    | readonly string[]
    | Readonly<Record<string, string>>
    | undefined;
  format?: Format | readonly Format[] | undefined;
  tsconfig?: string | undefined;
  declaration?: boolean | undefined;
  sourceMap?: boolean | "inline" | undefined;
  overrides?: Options | readonly Options[] | undefined;
}) {
  let success = true;
  const configs = Array.isArray(overrides) ? overrides : [overrides];
  const results = await Promise.allSettled(
    configs.map((config) =>
      build({
        // entry
        ...(entry && {
          entry: typeof entry === "object" ? entry : [entry],
        }),

        format: format ?? "esm",
        outDir: outputPath,
        tsconfig: tsconfig,
        dts: declaration,
        sourcemap: sourceMap,
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
  return success;
}
