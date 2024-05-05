import { detectNewline } from "detect-newline";

export default class Position {
  static zero = new Position(0, 0, 0);

  static fromOffset(offset: number, text: string): Position {
    const nl = detectNewline(text);

    let line = 0,
      column = 0;

    if (nl) {
      for (const s of text.split(nl)) {
        if (offset - s.length <= 0) {
          column = offset;
          offset = 0;
          break;
        } else {
          ++line;
          offset -= s.length + nl.length;
        }
      }

      if (offset > 0) {
        throw new Error(`Offset is out of bounds.`);
      }
    } else {
      column = offset;
    }

    return new Position(line, column, offset);
  }

  static fromLineAndColumn(
    line: number,
    column: number,
    text: string,
  ): Position {
    const nl = detectNewline(text);

    let offset = 0;

    if (nl) {
      for (let n = 0; n < line; n++) {
        const index = text.indexOf(nl, offset);
        if (index === -1) {
          throw new Error(`Line is out of bounds.`);
        }
        offset = index + nl.length;
      }
      offset += column;
      if (offset >= text.length) {
        throw new Error(`Column is out of bounds.`);
      }
    } else if (line === 0) {
      offset = column;
    } else {
      throw new Error(`Line is out of bounds.`);
    }

    return new Position(line, column, offset);
  }

  static translate(position: Position, offset: number, text: string): Position {
    return Position.fromOffset(position.offset + offset, text);
  }

  constructor(
    /** zero-indexed */
    public line: number,
    /** zero-indexed */
    public column: number,
    /** zero-indexed */
    public offset: number,
  ) {}

  clone() {
    return new Position(this.line, this.column, this.offset);
  }

  copy() {
    return this.clone();
  }
}
