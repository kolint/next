import { type AnalyzerPlugin } from "../plugin.js";
import { Snapshot } from "../snapshot.js";
import type { Rule } from "./rule.js";
import { transpile } from "./transpile.js";

const modules: {
  default: Rule;
}[] = [
  //
  await import("./rules/virtual-element-end-notation.js"),
];

export default function (): AnalyzerPlugin {
  return {
    name: "standard",

    async analyze(c) {
      const chunk = transpile(c.document);
      const snapshot = await new Snapshot({
        fileName: c.fileName + ".js",
        generated: chunk.content,
        original: c.text,
        sourceMap: chunk.generateSourceMap(c.fileName + ".js", c.text),
      });
      c.snapshots.javascript = snapshot;

      if (process.env["KO_PRINT_GENERATED_JAVASCRIPT_SNAPSHOT"] === "true") {
        process.stderr.write(snapshot.generated + "\n");
      }

      for (const module of modules) {
        module.default.check(c);
      }
    },
  };
}
