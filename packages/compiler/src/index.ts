import * as legacyCompiler from "@kolint/legacy-compiler";
import type { RawSourceMap } from "source-map";
import { Project, SourceFile } from "ts-morph";

export { Diagnostic, Severity } from "@kolint/legacy-compiler";

export class Compiler {
  readonly project: Project;

  constructor(tsConfigFilePath?: string) {
    this.project = new Project({
      tsConfigFilePath,
    });
  }

  createSnapshot(path: string) {
    return new Snapshot(this, path);
  }

  async check(path: string, text: string) {
    const snapshot = this.createSnapshot(path);
    await snapshot.update(text);
    return snapshot.diagnostics;
  }
}

export interface Compiled {
  sourceMap: RawSourceMap;
  code: string;
}

export class Snapshot {
  /**
   * @deprecated
   */
  _program = legacyCompiler.createProgram();

  #sourceFile: SourceFile;
  get sourceFile() {
    return this.#sourceFile;
  }

  #text: string | null = null;
  get text() {
    return this.#text;
  }

  #compiled: Compiled | null = null;
  get compiled() {
    return this.#compiled;
  }

  get diagnostics(): readonly legacyCompiler.Diagnostic[] {
    return this._program.diagnostics.slice();
  }

  #version = 0;
  get version() {
    return this.#version;
  }

  #synced: Promise<boolean> = Promise.resolve(false);
  get synced() {
    return this.#synced;
  }

  constructor(
    readonly compiler: Compiler,
    readonly path: string,
  ) {
    this.#sourceFile = this.compiler.project.createSourceFile(
      this.path,
      undefined,
      {
        overwrite: true,
      },
    );
  }

  increment(version = this.#version + 1) {
    this.#version = version;
  }

  update(text: string, version?: number) {
    return (this.#synced = (async () => {
      this._program.diagnostics = [];
      this.#text = text;
      this.#compiled = null;

      try {
        // Parse document
        const tokens = legacyCompiler.parse(this.path, text, this._program);
        const document = legacyCompiler.createDocument(
          this.path,
          tokens,
          this._program,
        );

        // Compile typescript contents
        const compiler = new legacyCompiler.Compiler(
          this.compiler.project.compilerOptions.get(),
        );
        const compiled = await compiler.compile(
          [document],
          this._program,
          true,
        );

        // Update source file
        this.#sourceFile.replaceWithText(compiled.code);

        this.#compiled = {
          sourceMap: compiled.map,
          code: compiled.code,
        };
        this.increment(version);

        return true;
      } catch (error) {
        if (error instanceof legacyCompiler.Diagnostic) {
          this._program.addDiagnostic(error);
        }
        return false;
      }
    })());
  }
}
