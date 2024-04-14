import * as legacy from "./legacy/index.js";
import type { SourceMapGenerator } from "source-map";

interface SnapshotState {
  filename: string;
  content: string;
  transpiled: string;
  sourceMap: SourceMapGenerator;
}

export class Snapshot {
  protected static prepare(content: string, filename = "unnamed") {
    return new Promise<SnapshotState>((resolve, reject) => {
      const program = legacy.createProgram();
      const tokens = legacy.parse(filename, content, program);
      const document = legacy.createDocument(filename, tokens, program);
      program.registerOutput = (filename2, transpiled, sourceMap) => {
        if (filename === filename2) {
          resolve({
            filename,
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

  static async from(content: string, filename?: string | undefined) {
    return new Snapshot(await Snapshot.prepare(content, filename));
  }

  #state: SnapshotState;

  get filename() {
    return this.#state.filename;
  }

  get sourceMap() {
    return this.#state.sourceMap;
  }

  get transpiled() {
    return this.#state.transpiled;
  }

  get content() {
    return this.#state.content;
  }

  protected constructor(init: Snapshot | SnapshotState) {
    if (init instanceof Snapshot) {
      init = init.#state;
    }
    this.#state = init;
  }

  async update(content: string, version?: number) {
    this.#state = await Snapshot.prepare(content, this.filename);
    this.version = version ?? this.version + 1;
  }

  version = 0;
}
