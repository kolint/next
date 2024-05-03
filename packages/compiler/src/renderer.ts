import type Chunk from "./chunk.js";
import Scaffold from "./scaffold.js";
import { type Project, type SourceFile, ts } from "ts-morph";

export default class Renderer {
  #scaffold: Chunk;
  #project: Project;
  #sourceFile: SourceFile;

  constructor({
    project,
    fileName = "view.html",
    mode,
    source,
  }: {
    project: Project;
    fileName?: string | undefined;
    mode?: "strict" | "loose" | undefined;
    source: string;
  }) {
    this.#project = project;
    this.#scaffold = new Scaffold(mode).render(source);

    this.#sourceFile = this.#project.createSourceFile(
      fileName + ".ts",
      this.#scaffold.content,
      { overwrite: true },
    );
  }

  #updateSourceFile() {
    this.#sourceFile.replaceWithText(this.#scaffold.content);
  }

  render() {
    // The position of the occurrences change when using `chunk.insert`.
    const getOccurrences = () => [
      ...this.#scaffold.occurrences("context"),
      ...this.#scaffold.occurrences("data"),
    ];

    // Render destructured paramaters for $context and $data.
    const length = getOccurrences().length;
    for (let i = 0; i < length; ++i) {
      const occurrence = getOccurrences()[i]!;

      const declaration = this.#sourceFile
        .getDescendantAtPos(occurrence)
        ?.getParent()
        ?.getParent();
      if (
        !declaration ||
        !declaration.isKind(ts.SyntaxKind.VariableDeclaration)
      ) {
        throw new Error(`Unable to get context declaration.`);
      }

      const initializer = declaration.getInitializerOrThrow();
      const type = initializer.getType();
      const destructured = type
        .getProperties()
        .map((symbol) => symbol.getName())
        .join(", ");

      this.#scaffold.insert(occurrence, destructured);
      this.#updateSourceFile();
    }

    return this.#scaffold;
  }
}
