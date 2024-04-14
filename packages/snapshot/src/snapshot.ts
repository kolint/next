import * as legacy from "./legacy/index.js";
import type { SourceMapGenerator } from "source-map";

interface SnapshotInit {
  original: string;
  transpiled: string;
  sourceMap: SourceMapGenerator;
}

export class Snapshot {
  from(original: string, filename = "unnamed") {
    return new Promise((resolve, reject) => {
      const program = legacy.createProgram();
      const tokens = legacy.parse(filename, original, program);
      const document = legacy.createDocument(filename, tokens, program);
      program.registerOutput = (filename2, transpiled, sourceMap) => {
        if (filename === filename2) {
          resolve(
            new Snapshot({
              original,
              transpiled,
              sourceMap,
            }),
          );
        }
      };
      program
        .compile([document]) //
        .catch((reason) => reject(reason));
    });
  }

  protected _init: SnapshotInit;

  protected constructor(init: Snapshot | SnapshotInit) {
    if (init instanceof Snapshot) {
      init = init._init;
    }
    this._init = init;
  }
}
