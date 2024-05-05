import { Chunk } from "./chunk.js";
import { describe, it, expect } from "bun:test";

describe("Chunk", () => {
  it("adds indentation to new content", () => {
    const chunk = new Chunk() //
      .write("foo")
      .indent()
      .nl()
      .write("bar")
      .dedent()
      .nl()
      .write("baz");

    expect(chunk.content).toBe("foo\n  bar\nbaz");
  });
});
