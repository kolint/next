import * as legacyCompiler from "@kolint/legacy-compiler";
import { dirname } from "node:path";
import type { RawSourceMap } from "source-map";
import { ts, Project, SourceFile } from "ts-morph";

export { Diagnostic, Severity } from '@kolint/legacy-compiler'

export class Compiler {
  #projects = new Map<string | undefined, Project>();

  getProject(path: string): Project {
    const tsConfigFilePath = ts.findConfigFile(
      dirname(path),
      ts.sys.fileExists,
    );
    let project = this.#projects.get(tsConfigFilePath);
    if (!project) {
      project = new Project({
        tsConfigFilePath,
      });
      this.#projects.set(tsConfigFilePath, project);
    }
    return project;
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

  #compiler: Compiler;
  get project() {
    return this.#compiler.getProject(this.path);
  }
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
    compiler: Compiler,
    readonly path: string,
  ) {
    this.#compiler = compiler;
    this.#sourceFile = this.project.createSourceFile(this.path, undefined, {
      overwrite: true,
    });
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
          this.project.compilerOptions.get(),
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
