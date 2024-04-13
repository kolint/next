export class Position {
  static zero = new Position(0, 0, 0);

  static fromOffset(offset: number, source: string): Position {
    let line = 0,
      column = 0,
      current = 0;

    while (current < offset) {
      if (source[current] === "\n") {
        line++;
        column = 0;
      } else {
        column++;
      }

      current++;
    }

    return new Position(line, column, offset);
  }

  static fromLineAndColumn(
    line: number,
    column: number,
    source: string,
  ): Position {
    let offset = 0;

    for (let i = 0; i < line; i++) {
      offset = source.indexOf("\n", offset) + 1;
    }

    offset += column;

    return new Position(line, column, offset);
  }

  constructor(
    /** zero-indexed */
    public line: number,
    /** zero-indexed */
    public column: number,
    /** zero-indexed */
    public offset: number,
  ) {}

  translate(to: Position): void {
    this.line += to.line;
    this.column += to.column;
    this.offset += to.offset;
  }
}

export class Range {
  readonly start: Position;
  readonly end: Position;

  constructor(start: Position, end: Position);
  constructor(
    startLine: number,
    startColumn: number,
    startOffset: number,
    endLine: number,
    endColumn: number,
    endOffset: number,
  );
  constructor(
    ...args:
      | [Position, Position]
      | [number, number, number, number, number, number]
  ) {
    if (args.length === 2) {
      this.start = args[0];
      this.end = args[1];
    } else {
      this.start = new Position(args[0], args[1], args[2]);
      this.end = new Position(args[3], args[4], args[5]);
    }
  }

  get offset(): readonly [number, number] {
    return [this.start.offset, this.end.offset];
  }

  get isEmpty(): boolean {
    return this.start.offset === this.end.offset;
  }

  translate(position: Position): this {
    this.start.translate(position);
    this.end.translate(position);
    return this;
  }
}
