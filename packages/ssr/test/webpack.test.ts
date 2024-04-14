import { test, describe } from "bun:test";
import { createFsFromVolume, Volume } from "memfs";
import assert from "node:assert/strict";
import { resolve } from "node:path";

describe("webpack (build-tool)", () => {
  test.todo("webpack", async (done) => {
    const { webpack } = await import("webpack");

    const compiler = webpack({
      mode: "production",
      entry: resolve(import.meta.dir, "__fixtures__/entry.js"),
      output: {
        path: "/",
        filename: "output.js",
      },
      module: {
        rules: [
          {
            test: /\.html$/,
            // Apparently, the first loader in the array is the last one to run.
            // ¯\_(ツ)_/¯
            use: ["raw-loader", "./src/webpack/loader.ts"],
          },
        ],
      },
    });

    const fs = createFsFromVolume(new Volume());
    // @ts-expect-error FIXME:
    compiler.outputFileSystem = fs;

    compiler.run((err, stats) => {
      if (err) {
        return done(err);
      }

      const close = (err?: unknown) => {
        compiler.close((closeErr) => {
          if (err) {
            return done(err);
          }

          if (closeErr) {
            return done(closeErr);
          }

          done();
        });
      };

      if (stats!.hasErrors() || stats!.hasWarnings()) {
        console.error(stats!.toString());
        return close(
          new Error(
            `webpack compilation has ${
              stats!.hasErrors() ? "errors" : "warnings"
            }`,
          ),
        );
      }

      const output = fs.readFileSync("/output.js", "utf8");
      assert(
        output.includes("SSR"),
        "generated chunk is missing rendered text",
      );

      return close();
    });
  });
});
