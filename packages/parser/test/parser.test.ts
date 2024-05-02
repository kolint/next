import { parse } from "../src/parser.js";
import { VirtualElement } from "../src/syntax-tree.js";
import { describe, test, expect } from "bun:test";
import assert from "node:assert/strict";

describe("parser", () => {
  test("Deep virtual elements", () => {
    const document = parse(
      "<!-- ko foo: foo --><!-- ko bar: bar --><!-- /ko --><!-- /ko -->",
    );
    expect(document).toMatchSnapshot();
  });

  test("Hidden virtual element", () => {
    const document = parse("<!-- #ko foo: foo --><!-- /ko -->");
    expect(document).toMatchSnapshot();
    assert(document.children[0] instanceof VirtualElement);
    expect(document.children[0].hidden).toBe(true);
  });
});
