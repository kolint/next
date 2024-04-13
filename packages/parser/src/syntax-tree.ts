import type { Range } from "./location.js";

export abstract class Node {
  constructor(public range: Range) {}
}

export class Text extends Node {
  constructor(
    public readonly content: string,
    range: Range,
  ) {
    super(range);
  }
}

export class Comment extends Node {
  constructor(
    public readonly content: string,
    range: Range,
  ) {
    super(range);
  }
}

export class Attribute {
  constructor(
    public readonly name: string,
    public readonly value: string,
    public readonly namespace: string | undefined,
    public readonly prefix: string | undefined,
    public readonly range: Range,
  ) {}
}

export class Element extends Node {
  constructor(
    public readonly tagName: string,
    public readonly attributes: readonly Attribute[],
    public readonly children: readonly Node[],
    range: Range,
  ) {
    super(range);
  }
}

export class VirtualElement extends Node {
  constructor(
    public readonly binding: string,
    public readonly param: string,
    public readonly children: readonly Node[],
    public readonly start: Comment,
    public readonly end: Comment,
    range: Range,
  ) {
    super(range);
  }
}

export class Document extends Node {
  constructor(
    public readonly children: readonly Node[],
    range: Range,
  ) {
    super(range);
  }
}

export type ChildNode = Element | VirtualElement | Text | Comment;

export function isChildNode(node: Node): node is ChildNode {
  return (
    node instanceof Element ||
    node instanceof VirtualElement ||
    node instanceof Text ||
    node instanceof Comment
  );
}

export type ParentNode = Element | VirtualElement | Document;

export function isParentNode(node: Node): node is ParentNode {
  return (
    node instanceof Element ||
    node instanceof VirtualElement ||
    node instanceof Document
  );
}
