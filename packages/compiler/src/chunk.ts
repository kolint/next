import { UNIVERSAL_NEWLINE_REGEX } from "./utils.js";
import { Position } from "@kolint/parser";
import { SourceMapGenerator } from "source-map";

export type Mapping = readonly [number, number];

export type ChunkOptions = {
  indent?: string | number | undefined;
  eol?: string | undefined;
};

export default class Chunk {
  #content = "";
  #mappings: Mapping[] = [];
  #locators = new Map<string, number[]>();
  #indentCount = 0;
  #eol: string;
  #indent: string;

  constructor(options?: ChunkOptions) {
    this.#eol = options?.eol ?? "\n";
    this.#indent =
      typeof options?.indent === "number"
        ? " ".repeat(options.indent)
        : options?.indent ?? "  ";
  }

  /**
   * Source content as text.
   */
  get content(): string {
    return this.#content;
  }

  /**
   * Mappings added by {@link map}.
   */
  get mappings(): readonly Mapping[] {
    return this.#mappings;
  }

  /**
   * The current offset.
   */
  get length() {
    return this.content.length;
  }

  /**
   * Clones the chunk. Used to avoid mutating the original chunk.
   *
   * @returns The cloned chunk.
   */
  clone(): Chunk {
    const chunk = new Chunk();
    chunk.#content = this.#content;
    chunk.#mappings = this.#mappings;
    chunk.#locators = this.#locators;
    chunk.#indentCount = this.#indentCount;
    chunk.#indent = this.#eol;
    chunk.#indent = this.#indent;
    return chunk;
  }

  /**
   * Writes content to the current offset.
   *
   * @param content The new content.
   */
  write(content: string): this {
    const indent = this.#indent.repeat(this.#indentCount);

    if (this.#content.endsWith("\n")) {
      this.#content += indent;
    }

    const lines = content.split(UNIVERSAL_NEWLINE_REGEX);
    this.#content += lines.shift();
    this.#content += lines.map((line) =>
      line.trim() === "" ? "\n" : "\n" + indent + line,
    );

    return this;
  }

  /**
   * Finds all the occurances of the locators added using {@link locator}.
   *
   * @param locator The identifier of the locator. Same as passed to {@link locator}.
   */
  occurrences(locator: string): number[] {
    let occurrences = this.#locators.get(locator);
    if (!occurrences) {
      this.#locators.set(locator, (occurrences = []));
    }
    return occurrences;
  }

  /**
   * Adds mapping to the original content at the current source offset.
   *
   * @param original The original content offset.
   */
  map(original: number): this {
    this.#mappings.push([this.length, original]);
    return this;
  }

  /**
   * Adds a locator in the chunk. The occurances of the locator is stored in
   * the chunk and can be accessed using {@link occurances}.
   *
   * @param name The identifier of the locator.
   */
  locator(name: string): this {
    this.occurrences(name).push(this.length);
    return this;
  }

  /**
   * Adds newline(s) (by default 1) at the current offset.
   *
   * @param count The number of newlines to add.
   */
  nl(count = 1) {
    this.#content += "\n".repeat(count);
    return this;
  }

  /**
   * Increases indentation by the specificed offset (by default 1).
   *
   * @param offset The offset to apply to the indentation.
   * @returns
   */
  indent(offset = 1) {
    this.#indentCount = Math.max(this.#indentCount + offset, 0);
    return this;
  }

  /**
   * Decreases indentation by the specificed offset (by default 1). Opposite of
   * {@link indent}.
   *
   * @param offset The negated offset to apply to the indentation.
   */
  dedent(offset = 1): this {
    this.indent(-offset);
    return this;
  }

  /**
   * Inserts content at a specific offset in the chunk, and {@link translate}s
   * the positions accordingly.
   *
   * @param offset The offset of where to insert the new content.
   * @param string The new content to insert.
   */
  insert(offset: number, string: string) {
    this.translate(offset, string.length);

    this.#content =
      this.#content.slice(0, offset) + string + this.#content.slice(offset);

    return this;
  }

  /**
   * Translates the chunk's positions (mappings and locators) by a certain length.
   *
   * @param offset From where to translate. Everything below this offset is untouched.
   * @param length The length to translate the positions with.
   */
  translate(offset: number, length: number) {
    // Translate mappings.
    for (let i = 0; i < this.#mappings.length; ++i) {
      if (this.#mappings[i]![0] >= offset) {
        this.#mappings[i] = [
          this.#mappings[i]![0] + length,
          this.#mappings[i]![1],
        ];
      }
    }

    // Translate locators.
    for (const occurrences of this.#locators.values()) {
      for (let i = 0; i < occurrences.length; ++i) {
        if (occurrences[i]! >= offset) {
          occurrences[i]! += length;
        }
      }
    }

    return this;
  }

  /**
   * Adds chunk(s) to the current offset. Content is {@link translate}d accordingly.
   *
   * @param chunks
   * @returns
   */
  add(...chunks: (Chunk | readonly Chunk[])[]): this {
    for (let chunk of chunks.flat()) {
      // Copy chunk to avoid mutating the original.
      chunk = chunk.clone();

      // Indent all content in chunk.
      let offset = 0;
      for (const line of chunk.content.split(UNIVERSAL_NEWLINE_REGEX)) {
        const indent = this.#indent.repeat(this.#indentCount);
        chunk.insert(offset, indent);
        offset += indent.length + line.length + 1;
      }

      // Translate everything in chunk to current offset.
      chunk.translate(0, this.length);

      // Copy mappings.
      this.#mappings.push(...chunk.mappings);

      // Copy locators.
      for (const [locator, occurrences] of chunk.#locators) {
        this.occurrences(locator).push(...occurrences);
      }

      // Push content.
      this.#content += chunk.#content;
    }

    return this;
  }

  /**
   * Generates a source map adhearing to the
   * [Source Map v3 Specification](https://sourcemaps.info/spec.html).
   *
   * @param original The original content.
   * @returns Raw source map as json.
   */
  generateSourceMap(source: string, original: string) {
    const generator = new SourceMapGenerator();

    for (const mapping of this.#mappings) {
      const a = Position.fromOffset(mapping[0], this.#content);
      const b = Position.fromOffset(mapping[1], original);

      console.log(
        `${a.line + 1}:${a.column + 1} -> ${b.line + 1}:${b.column + 1}`,
      );

      generator.addMapping({
        source,
        generated: {
          line: a.line + 1,
          column: a.column,
        },
        original: {
          line: b.line + 1,
          column: b.column,
        },
      });
    }

    return generator.toJSON();
  }
}
