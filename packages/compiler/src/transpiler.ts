import Renderer from "./renderer.js";
import type { RawSourceMap } from "source-map";
import { Project, type CompilerOptions } from "ts-morph";

export type TranspileOutput = {
  code: string;
  sourceMap: RawSourceMap | null;
};

export interface TranspileOptions {
  sourceMap?: boolean;
  mode?: "strict" | "loose";
  fileName?: string;
}

export interface TranspilerOptions {
  tsConfig?: string | CompilerOptions;
}

export class Transpiler {
  #project: Project;

  constructor(options?: TranspilerOptions) {
    this.#project = new Project({
      ...(typeof options?.tsConfig === "string"
        ? { tsConfigFilePath: options.tsConfig }
        : { compilerOptions: options?.tsConfig }),
      skipAddingFilesFromTsConfig: true,
    });
  }

  transpile(source: string, options?: TranspileOptions): TranspileOutput;
  transpile(
    source: string,
    options: TranspileOptions & { sourceMap: true },
  ): TranspileOutput & { sourceMap: RawSourceMap };
  transpile(
    source: string,
    options: TranspileOptions & { sourceMap: false },
  ): TranspileOutput & { sourceMap: null };
  transpile(source: string, options?: TranspileOptions): TranspileOutput {
    const chunk = new Renderer({
      project: this.#project,
      source,
      fileName: options?.fileName,
      mode: options?.mode,
    }).render();

    return {
      code: chunk.content,
      sourceMap: options?.sourceMap
        ? chunk.generateSourceMap(options?.fileName ?? "view.html", source)
        : null,
    };
  }
}
