import * as legacy from "./legacy/index.js";
import { dirname } from "node:path";
import type { SourceMapGenerator } from "source-map";
import { ts, Project, SourceFile } from "ts-morph";

interface SnapshotState {
  path: string;
  content: string;
  transpiled: string;
  sourceMap: SourceMapGenerator;
}

export class Snapshot {
  protected static prepare(content: string, path: string) {
    return new Promise<SnapshotState>((resolve, reject) => {
      const program = legacy.createProgram();
      const tokens = legacy.parse(path, content, program);
      const document = legacy.createDocument(path, tokens, program);
      program.registerOutput = (path2, transpiled, sourceMap) => {
        console.log('output: ' + path);
        if (path === path2) {
          resolve({
            path: path,
            content,
            transpiled,
            sourceMap,
          });
        }
      };
      program
        .compile([document]) //
        .catch((reason) => reject(reason));
    });
  }

  static async from(content: string, path: string) {
    return new Snapshot(await Snapshot.prepare(content, path));
  }

  #state: SnapshotState;

  get path() {
    return this.#state.path;
  }

  get tsPath() {
    return this.path + ".ts";
  }

  get sourceMap() {
    return this.#state.sourceMap;
  }

  get tsContent() {
    return this.#state.transpiled;
  }

  get content() {
    return this.#state.content;
  }

  readonly sourceFile: SourceFile;

  protected constructor(init: Snapshot | SnapshotState) {
    if (init instanceof Snapshot) {
      init = init.#state;
    }
    this.#state = init;

    const tsConfigFilePath = ts.findConfigFile(
      dirname(this.path),
      ts.sys.fileExists,
    );
    const project = new Project({
      tsConfigFilePath,
      skipAddingFilesFromTsConfig: true,
    });
    this.sourceFile = project.createSourceFile(this.tsPath, this.tsContent);
  }

  async update(content: string, version?: number) {
    this.#state = await Snapshot.prepare(content, this.path);
    this.version = version ?? this.version + 1;
  }

  version = 0;
}
