import logger from "./logger.js";
import { Compiler, Severity } from "@kolint/compiler";
import { ts, getCompilerOptionsFromTsConfig } from "@kolint/ts-utils";
import { globby } from "globby";
import { writeFileSync } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
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
    const registerOutput = this.#options?.debug
      ? (filename: string, code: string, map: SourceMapGenerator) => {
          writeFileSync(filename + ".debug.ts", code);
          writeFileSync(filename + ".debug.map", map.toString());
        }
      : () => {};

    const files = (
      await Promise.all(
        paths.map(async (path) => {
          try {
            await access(path);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
              console.error(`Path '${path}' does not exist.`);
              process.exit(1);
            } else {
              throw error;
            }
          }

          const stats = await stat(path);
          const files = stats.isDirectory()
            ? await globby(this.#options?.include ?? "**/*.html", {
                dot: true,
                ignore: [...DEFAULT_EXCLUDE, ...(this.#options?.exclude ?? [])],
                cwd: path,
                absolute: true,
              })
            : [path];
          return files;
        }),
      )
    ).flat();

    logger.debug(
      "Checking files:",
      files.map((file) => `\n  - ${file}`),
    );

    const snapshots = await Promise.all(
      files.map(async (file) => {
        const text = await readFile(file, "utf8");
        const snapshot = await this.compiler.createSnapshot(file, text);
        snapshot._legacy!.reporting.registerOutput = registerOutput;
        return snapshot;
      }),
    );

    await this.compiler.compile(snapshots);
    const diagnostics = await this.compiler.check(snapshots);

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
