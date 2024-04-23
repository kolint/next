import * as legacyCompiler from "@kolint/legacy-compiler";
import { type ts } from "@kolint/ts-utils";
import type { RawSourceMap } from "source-map";

export { Diagnostic, Severity } from "@kolint/legacy-compiler";

export interface CompilerOutput {
  code: string;
  map: RawSourceMap;
}

export class Compiler {
  /**
   * @deprecated
   */
  _legacy: legacyCompiler.Compiler;

  constructor(readonly compilerOptions: ts.CompilerOptions) {
    this._legacy = new legacyCompiler.Compiler(this.compilerOptions);
  }

  async createSnapshot(path: string, text: string) {
    const snapshot = new Snapshot(this, path);
    snapshot.update(text);
    return snapshot;
  }

  async compile(snapshots: readonly Snapshot[]) {
    await this._legacy.compile(
      snapshots
        .map((snapshot) => snapshot._legacy)
        .filter(
          (legacy): legacy is NonNullable<typeof legacy> =>
            !!(legacy && !legacy.program),
        ),
    );
  }

  async check(...snapshots: (Snapshot | readonly Snapshot[])[]) {
    const flat = snapshots.flat();
    await this.compile(flat);
    return (
      await Promise.all(
        flat
          .filter((snapshot) => snapshot._legacy)
          .map((snapshot) => this._legacy.typeCheck(snapshot._legacy!)),
      )
    ).flat();
  }

  async emit(snapshot: Snapshot): Promise<CompilerOutput | null> {
    if (!snapshot._legacy) {
      return null;
    }
    await this.compile([snapshot]);
    return await this._legacy.emit(snapshot._legacy);
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
  _legacy?: legacyCompiler.LegacyCompilerSnapshot;

  #text: string | null = null;
  get text() {
    return this.#text;
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
  ) {}

  increment(version = this.#version + 1) {
    this.#version = version;
  }

  update(text: string, version?: number) {
    return (this.#synced = (async () => {
      const program = legacyCompiler.createProgram();
      this.#text = text;

      try {
        // Parse document
        const tokens = legacyCompiler.parse(this.path, text, program);
        const document = legacyCompiler.createDocument(
          this.path,
          tokens,
          program,
        );
        this._legacy = await this.compiler._legacy.createSnapshot(
          document,
          program,
        );

        this.increment(version);

        return true;
      } catch (error) {
        if (error instanceof legacyCompiler.Diagnostic) {
          program.addDiagnostic(error);
        }
        return false;
      }
    })());
  }
}
