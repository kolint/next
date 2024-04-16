import * as legacyCompiler from "@kolint/legacy-compiler";
import { ts } from "@kolint/ts-utils";
import type { RawSourceMap } from "source-map";

export { Diagnostic, Severity } from "@kolint/legacy-compiler";

export class Compiler {
  constructor(readonly compilerOptions: ts.CompilerOptions) {}

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

  #sourceFile: ts.SourceFile;
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
    this.#sourceFile = ts.createSourceFile(path, "", ts.ScriptTarget.Latest);
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
          this.compiler.compilerOptions,
        );
        const compiled = await compiler.compile(
          [document],
          this._program,
          true,
        );

        // Update source file
        this.#sourceFile.update(
          compiled.code,
          ts.createTextChangeRange(
            ts.createTextSpan(
              this.#sourceFile.getFullStart(),
              this.#sourceFile.getFullWidth(),
            ),
            compiled.code.length,
          ),
        );

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
