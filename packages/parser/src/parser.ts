import { Range, Position } from "./location.js";
import {
  isP5CommentNode,
  isP5Element,
  isP5TextNode,
  p5,
  p5ToRange,
  type p5t,
} from "./parse5-utils.js";
import {
  Document,
  Node,
  Text,
  VirtualElement,
  Comment,
  Element,
  Attribute,
} from "./syntax-tree.js";

const virtualElementStart = /\s*ko\s+([^\s]+)\s*:([^]*)/;
const virtualElementEnd = /\s*\/ko\s([^]*)/;

export interface ParseOptions {
  onError?: ((error: p5.ParserError) => void) | undefined;
}

export function parse(document: string, options?: ParseOptions): Document {
  const root = p5.parseFragment(document, {
    sourceCodeLocationInfo: true,
    scriptingEnabled: false,
    onParseError: options?.onError,
  });
  const iter = root.childNodes[Symbol.iterator]();
  let children: Node[] = [];
  let result: IteratorResult<p5t.Node> | undefined;

  while (!(result = iter.next()).done) {
    children.push(parseNode(result.value, iter));
  }

  return new Document(children, new Range(Position.zero, Position.zero));
}

function parseNode(node: p5t.Node, iter: Iterator<p5t.Node>): Node {
  switch (true) {
    case isP5TextNode(node): {
      return new Text(node.value, p5ToRange(node.sourceCodeLocation!));
    }
    case isP5CommentNode(node): {
      if (virtualElementStart.test(node.data)) {
        const [binding, param] = virtualElementStart
          .exec(node.data)!
          .slice(1) as [string, string];

        let balance = 1;
        let children: p5t.Node[] = [];
        let result: IteratorResult<p5t.Node> | undefined;
        let endComment: p5t.CommentNode | undefined;

        while (!(result = iter.next()).done) {
          if (isP5CommentNode(result.value)) {
            if (virtualElementStart.test(result.value.data)) {
              ++balance;
            } else if (virtualElementEnd.test(result.value.data)) {
              --balance;

              if (balance === 0) {
                endComment = result.value as p5t.CommentNode;
                break;
              }
            }
          }

          children.push(result.value);
        }

        if (!endComment) {
          throw new Error("Unbalanced virtual element (knockout comment).");
        }

        const iter2 = children[Symbol.iterator]();
        let children2: Node[] = [];
        let result2: IteratorResult<p5t.Node> | undefined;

        while (!(result2 = iter2.next()).done) {
          children2.push(parseNode(result2.value, iter2));
        }

        return new VirtualElement(
          binding,
          param,
          children2,
          new Comment(node.data, p5ToRange(node.sourceCodeLocation!)),
          new Comment(
            endComment.data,
            p5ToRange(endComment.sourceCodeLocation!),
          ),
          new Range(
            p5ToRange(node.sourceCodeLocation!).start,
            p5ToRange(endComment.sourceCodeLocation!).end,
          ),
        );
      } else {
        return new Comment(node.data, p5ToRange(node.sourceCodeLocation!));
      }
    }
    case isP5Element(node): {
      const iter = node.childNodes[Symbol.iterator]();
      const children: Node[] = [];
      let current: IteratorResult<p5t.Node> | undefined;

      while (!(current = iter.next()).done) {
        children.push(parseNode(current.value, iter));
      }

      return new Element(
        node.tagName,
        node.attrs.map(
          (attr) =>
            new Attribute(
              attr.name,
              attr.value,
              attr.namespace,
              attr.prefix,
              p5ToRange(node.sourceCodeLocation!.attrs![attr.name]!),
            ),
        ),
        children,
        p5ToRange(node.sourceCodeLocation!),
      );
    }
    default: {
      throw new Error("Unexpected node type");
    }
  }
}
