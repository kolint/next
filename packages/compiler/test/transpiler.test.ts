import { Transpiler } from "../src/transpiler.js";
import { describe, test, expect, beforeAll } from "bun:test";

describe("Transpiler", () => {
  let transpiler!: Transpiler;

  beforeAll(() => {
    transpiler = new Transpiler();
  });

  test("transpiles element binding", () => {
    const output = transpiler.transpile("<div data-bind='foo: bar'></div>");
    expect(output.code).toContain("foo");
    expect(output.code).toContain("bar");
  });
});
