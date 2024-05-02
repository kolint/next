import { Range, Position } from "./location.js";
import {
  isParse5CommentNode,
  isParse5Element,
  isParse5TextNode,
  parse5,
  parse5LocationToRange,
  type parse5TreeAdapter,
} from "./parse5-utils.js";
import {
  Document,
  type Node,
  Text,
  VirtualElement,
  Comment,
  Element,
  Attribute,
} from "./syntax-tree.js";

const virtualElementStart = /\s*(#?)ko\s+([^\s]+)\s*:([^]*)/;
const virtualElementEnd = /\s*\/ko\s([^]*)/;

export interface ParseOptions {
  onError?: ((error: parse5.ParserError) => void) | undefined;
}

export function parse(document: string, options?: ParseOptions): Document {
  const root = parse5.parseFragment(document, {
    sourceCodeLocationInfo: true,
    scriptingEnabled: false,
    onParseError: options?.onError,
  });
  const iter = root.childNodes[Symbol.iterator]();
  const children: Node[] = [];
  let result: IteratorResult<parse5TreeAdapter.Node> | undefined;

  while (!(result = iter.next()).done) {
    children.push(parseNode(result.value, iter));
  }

  return new Document(children, new Range(Position.zero, Position.zero));
}

function parseNode(
  node: parse5TreeAdapter.Node,
  iter: Iterator<parse5TreeAdapter.Node>,
): Node {
  switch (true) {
    case isParse5TextNode(node): {
      return new Text(
        node.value,
        parse5LocationToRange(node.sourceCodeLocation!),
      );
    }
    case isParse5CommentNode(node): {
      if (virtualElementStart.test(node.data)) {
        const [prefix, binding, param] = virtualElementStart
          .exec(node.data)!
          .slice(1) as [string, string, string];

        const hidden = prefix === "#";

        let balance = 1;
        const children: parse5TreeAdapter.Node[] = [];
        let result: IteratorResult<parse5TreeAdapter.Node> | undefined;
        let endComment: parse5TreeAdapter.CommentNode | undefined;

        while (!(result = iter.next()).done) {
          if (isParse5CommentNode(result.value)) {
            if (virtualElementStart.test(result.value.data)) {
              ++balance;
            } else if (virtualElementEnd.test(result.value.data)) {
              --balance;

              if (balance === 0) {
                endComment = result.value as parse5TreeAdapter.CommentNode;
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
        const children2: Node[] = [];
        let result2: IteratorResult<parse5TreeAdapter.Node> | undefined;

        while (!(result2 = iter2.next()).done) {
          children2.push(parseNode(result2.value, iter2));
        }

        return new VirtualElement(
          binding,
          param,
          hidden,
          children2,
          new Comment(
            node.data,
            parse5LocationToRange(node.sourceCodeLocation!),
          ),
          new Comment(
            endComment.data,
            parse5LocationToRange(endComment.sourceCodeLocation!),
          ),
          new Range(
            parse5LocationToRange(node.sourceCodeLocation!).start,
            parse5LocationToRange(endComment.sourceCodeLocation!).end,
          ),
        );
      } else {
        return new Comment(
          node.data,
          parse5LocationToRange(node.sourceCodeLocation!),
        );
      }
    }
    case isParse5Element(node): {
      const iter = node.childNodes[Symbol.iterator]();
      const children: Node[] = [];
      let current: IteratorResult<parse5TreeAdapter.Node> | undefined;

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
              parse5LocationToRange(
                node.sourceCodeLocation!.attrs![attr.name]!,
              ),
            ),
        ),
        children,
        parse5LocationToRange(node.sourceCodeLocation!),
      );
    }
    default: {
      throw new Error("Unexpected node type");
    }
  }
}
