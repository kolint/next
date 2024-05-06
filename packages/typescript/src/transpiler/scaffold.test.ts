import Scaffold from "./scaffold.js";
import { describe, test, expect } from "bun:test";

describe("Scaffold", () => {
  test("transpiles element binding", () => {
    const chunk = new Scaffold().render("<div data-bind='foo: bar'></div>");
    expect(chunk.content).toContain("foo");
    expect(chunk.content).toContain("bar");
  });
});
