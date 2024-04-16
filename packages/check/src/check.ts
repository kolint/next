import { Compiler, Severity, type Diagnostic } from "@kolint/compiler";
import { ts, getCompilerOptionsFromTsConfig } from "@kolint/ts-utils";
import { globby } from "globby";
import { writeFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { SourceMapGenerator } from "source-map";

export interface CheckOptions {
  include?: readonly string[] | undefined;
  exclude?: readonly string[] | undefined;
  severity?: { [key: string]: "off" | "warn" | "warning" | "error" };
  debug?: boolean;
  tsconfig?: string | undefined;
}

export async function check(paths: readonly string[], options?: CheckOptions) {
  // TODO: report if tsconfig is not found
  const tsConfigFilePath =
    options?.tsconfig ?? ts.findConfigFile(process.cwd(), ts.sys.fileExists);
  // TODO: reports compiler options errors
  const compilerOptions = tsConfigFilePath
    ? getCompilerOptionsFromTsConfig(tsConfigFilePath).options
    : ts.getDefaultCompilerOptions();

  const compiler = new Compiler(compilerOptions);
  const diagnostics: Diagnostic[] = [];

  const registerOutput = options?.debug
    ? (filename: string, code: string, map: SourceMapGenerator) => {
        writeFileSync(filename + ".debug.ts", code);
        writeFileSync(filename + ".debug.map", map.toString());
      }
    : () => {};

  for (const path of paths) {
    try {
      const stats = await stat(path);
      const files = stats.isDirectory()
        ? await globby(options?.include ?? "**/*.html", {
            dot: true,
            ignore: options?.exclude?.slice(),
            cwd: path,
            absolute: true,
          })
        : [path];

      for (const file of files) {
        const snapshot = compiler.createSnapshot(file);
        snapshot._program.registerOutput = registerOutput;
        const text = await readFile(file, "utf8");
        await snapshot.update(text);
        diagnostics.push(...snapshot.diagnostics);
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  if (options?.severity) {
    for (const diagnostic of diagnostics) {
      const severity =
        options.severity[diagnostic.code] ?? options.severity[diagnostic.name];

      if (severity) {
        switch (severity) {
          case "error":
            diagnostic.severity = Severity.Error;
            break;

          case "warn":
          case "warning":
            diagnostic.severity = Severity.Warning;
            break;

          case "off":
            diagnostic.severity = Severity.Off;
            break;
        }
      }
    }
  }

  diagnostics.sort((a, b) => {
    if (a.filePath < b.filePath) return -1;
    if (a.filePath > b.filePath) return 1;
    const byLine =
      (a.location?.first_line ?? -1) - (b.location?.first_line ?? -1);
    const byCol =
      (a.location?.first_column ?? -1) - (b.location?.first_column ?? -1);
    return byLine || byCol;
  });

  return diagnostics;
}
