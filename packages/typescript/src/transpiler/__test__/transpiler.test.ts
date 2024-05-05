import { Transpiler } from "../transpiler.js";
import { describe, test, expect, beforeAll } from "bun:test";

describe("Transpiler", () => {
  let transpiler!: Transpiler;
  const transpile = (text: string, mode?: "strict" | "loose") =>
    transpiler.transpile("view.html", text, mode);

  beforeAll(() => {
    transpiler = new Transpiler();
  });

  test("transpiles element binding", () => {
    const output = transpile("<div data-bind='foo: bar'></div>");
    expect(output.generated).toContain("foo");
    expect(output.generated).toContain("bar");
  });
});
