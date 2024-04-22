import { Compiler, Severity, type Diagnostic } from "@kolint/compiler";
import { ts, getCompilerOptionsFromTsConfig } from "@kolint/ts-utils";
import { globby } from "globby";
import { writeFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { type SourceMapGenerator } from "source-map";

const DEFAULT_EXCLUDE = ["**/node_modules/**"];

export interface CheckOptions {
  include?: readonly string[] | undefined;
  exclude?: readonly string[] | undefined;
  severity?: { [key: string]: "off" | "warn" | "warning" | "error" };
  debug?: boolean;
  tsconfig?: string | undefined;
}

export class Checker {
  #options: CheckOptions;
  readonly compiler: Compiler;

  constructor(options?: CheckOptions) {
    this.#options = options ?? {};
    // TODO: report if tsconfig is not found
    const tsConfigFilePath =
      this.#options.tsconfig ??
      ts.findConfigFile(process.cwd(), ts.sys.fileExists);
    // TODO: reports compiler options errors
    const compilerOptions = tsConfigFilePath
      ? getCompilerOptionsFromTsConfig(tsConfigFilePath).options
      : ts.getDefaultCompilerOptions();
    this.compiler = new Compiler(compilerOptions);
  }

  async check(paths: readonly string[]) {
    const diagnostics: Diagnostic[] = [];

    const registerOutput = this.#options?.debug
      ? (filename: string, code: string, map: SourceMapGenerator) => {
          writeFileSync(filename + ".debug.ts", code);
          writeFileSync(filename + ".debug.map", map.toString());
        }
      : () => {};

    for (const path of paths) {
      try {
        const stats = await stat(path);
        const files = stats.isDirectory()
          ? await globby(this.#options?.include ?? "**/*.html", {
              dot: true,
              ignore: [...DEFAULT_EXCLUDE, ...(this.#options?.exclude ?? [])],
              cwd: path,
              absolute: true,
            })
          : [path];

        for (const file of files) {
          const snapshot = this.compiler.createSnapshot(file);
          snapshot._program.registerOutput = registerOutput;
          const text = await readFile(file, "utf8");
          await snapshot.update(text);
          diagnostics.push(...snapshot.diagnostics);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      }
    }

    if (this.#options?.severity) {
      for (const diagnostic of diagnostics) {
        const severity =
          this.#options.severity[diagnostic.code] ??
          this.#options.severity[diagnostic.name];

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
}

export async function check(paths: readonly string[], options?: CheckOptions) {
  const checker = new Checker(options);
  return checker.check(paths);
}
