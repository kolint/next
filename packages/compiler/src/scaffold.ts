import Chunk from "./chunk.js";
import { ns, quote } from "./utils.js";
import {
  parse,
  type Node,
  Element,
  VirtualElement,
  Binding,
  type Document,
  Scope,
} from "@kolint/parser";

export default class Scaffold {
  #mode: "strict" | "loose";

  constructor(mode?: "strict" | "loose") {
    this.#mode = mode ?? "loose";
  }

  render(source: string) {
    const document = parse(source);
    return this.#renderDocument(document);
  }

  #renderDocument(document: Document) {
    return new Chunk()
      .write(`import ${ns} from '@kolint/internal/${this.#mode}';`)
      .nl(2)
      .write(`declare const $context: ${ns}.BindingContext<{}>;`)
      .nl(2)
      .add(this.#renderNodes(document.children));
  }

  #renderNodes(nodes: readonly Node[]): Chunk[] {
    return nodes
      .map((node) => this.#renderNode(node))
      .filter((value): value is Exclude<typeof value, undefined> => !!value);
  }

  #renderNode(node: Node): Chunk | undefined {
    if (node instanceof Element) {
      let closure: Chunk | undefined;
      for (const binding of node.bindings) {
        closure = this.#renderBindingClosure(binding, closure);
      }

      const decendants = this.#renderNodes(node.children);

      if (closure) {
        if (decendants.length > 0) {
          return this.#renderDecendantClosure(closure, decendants) //
            .write(";")
            .nl(2);
        } else {
          return closure //
            .write(";")
            .nl(2);
        }
      } else {
        return new Chunk().add(decendants);
      }
    }

    if (node instanceof VirtualElement) {
      let binding = node.binding;

      if (node.hidden && node.binding.name.text === "use") {
        binding = new Binding(
          new Scope("with", node.binding.name.range),
          new Scope(
            `undefined! as ${ns}.Interop<typeof import(${quote(binding.param.text.trim())})>`,
            node.binding.param.range,
          ),
          node.binding.parent,
          binding.range,
        );
      }

      const closure = this.#renderBindingClosure(binding);
      const decendants = this.#renderNodes(node.children);

      if (decendants.length > 0) {
        return this.#renderDecendantClosure(closure, decendants)
          .write(";")
          .nl(2);
      } else {
        return closure //
          .write(";")
          .nl(2);
      }
    }

    return undefined;
  }

  #renderDecendantClosure(parent: Chunk, decendants: Chunk[]) {
    return new Chunk()
      .write("(($context) => {")
      .nl()
      .indent()
      .add(decendants)
      .dedent()
      .write("})(")
      .nl()
      .indent()
      .add(parent)
      .dedent()
      .nl()
      .write(")");
  }

  #renderBindingClosure(binding: Binding, context?: Chunk) {
    const chunk = new Chunk()
      .write(
        `// "${binding.name.text.replace(/[\n\r]/g, "")}: ${binding.param.text.replace(/[\n\r]/g, "")}" (${binding.range.start.line}:${binding.range.start.column})`,
      )
      .nl()
      .write("(($context) => {")
      .nl()
      .indent()
      .write("const { ")
      .locator("context")
      .write(" } = $context;")
      .nl()
      .write("const { ")
      .locator("data")
      .write(" } = $context.$data;")
      .nl(2)
      .write(`return ${ns}.$`);

    if (/^[a-z$_][a-z$_0-9]*$/i.test(binding.name.text)) {
      chunk
        .write(".")
        .map(binding.name.range.start.offset)
        .write(binding.name.text);
    } else {
      chunk
        .map(binding.name.range.start.offset)
        .write(`[${quote(binding.name.text)}]`);
    }

    chunk //
      .map(binding.param.range.start.offset)
      .write(`((${binding.param.text}), $context)`)
      .map(binding.range.end.offset)
      .write(";")
      .dedent()
      .nl()
      .write("})(");

    if (context) {
      chunk //
        .nl()
        .indent()
        .add(context)
        .dedent()
        .nl();
    } else {
      chunk.write("$context");
    }

    return chunk.write(")");
  }
}
