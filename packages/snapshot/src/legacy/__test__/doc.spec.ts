import * as utils from "./utils";
import { describe, it } from "bun:test";

describe("Document Builder", () => {
  // https://github.com/kolint/kolint/pull/281
  it.skip("Fails on unbalanced nodes", () => {
    utils.buildsDoesThrow("<div><div></div>");
  });
});
