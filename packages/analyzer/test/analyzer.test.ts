/* eslint-disable @typescript-eslint/no-explicit-any */
import Analyzer from "../src/analyzer.js";
import { describe, test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

describe("Analyzer", async () => {
  const analyzer = new Analyzer();

  {
    const fixtures = (await import("./fixtures/diagnostics.json")).fixtures as {
      todo?: boolean;
      name: string;
      sample: string;
      start?: any;
      end?: any;
    }[];

    for (const fixture of fixtures) {
      test.todoIf(!!fixture.todo)(
        `Reports diagnostic '${fixture.name}'${fixture.start ? " with location" : ""}`,
        async () => {
          const path = fileURLToPath(
            new URL(`./samples/${fixture.sample}`, import.meta.url),
          );
          expect(existsSync(path)).toBe(true);
          const content = await readFile(path, "utf8");
          const issues = await analyzer.analyze(path, content);
          const issue = issues.find((issue) => issue.name === fixture.name);
          expect(issue).toBeDefined();
          if (fixture.start) {
            expect(issue?.start).toMatchObject(fixture.start);
          }
          if (fixture.end) {
            expect(issue?.end).toMatchObject(fixture.end);
          }
        },
      );
    }
  }
});
