import { Checker } from "../src/index.js";
import { describe, test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

describe("Analyzer", async () => {
  const checker = new Checker();

  for (const fixture of (await import("./fixtures/diagnostics.json")).default) {
    test.todoIf(fixture.todo)(
      `Reports diagnostic '${fixture.code}'`,
      async () => {
        const path = fileURLToPath(
          new URL(`./samples/${fixture.sample}`, import.meta.url),
        );
        expect(existsSync(path)).toBe(true);
        const diagnostics = await checker.check([path]);
        const diagnostic = diagnostics.find(
          (diagnostic) => diagnostic.code === fixture.code,
        );
        expect(diagnostic).toBeDefined();
        if (fixture.location) {
          expect(diagnostic?.location).toMatchObject(fixture.location);
        }
      },
    );
  }
});
