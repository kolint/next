import { Compiler, Snapshot } from "@kolint/compiler";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SourceMapConsumer } from "source-map";
import { ts } from "ts-morph";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  type Connection,
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  Diagnostic,
  Range,
  Position,
} from "vscode-languageserver/node.js";

export interface LanguageServerOptions {
  connection?: Connection;
}

export function startLanguageServer(options?: LanguageServerOptions) {
  const connection =
    options?.connection ?? createConnection(ProposedFeatures.all);
  const documents = new TextDocuments(TextDocument);

  const snapshots = new WeakMap<TextDocument, Snapshot>();

  documents.onDidOpen(async (event) => {
    await refreshDocument(event.document);
  });

  documents.onDidChangeContent(async (event) => {
    await refreshDocument(event.document);
  });

  documents.onDidClose((event) => {
    snapshots.delete(event.document);
  });

  async function refreshDocument(document: TextDocument) {
    let snapshot = snapshots.get(document);
    if (!snapshot) {
      const path = fileURLToPath(document.uri);

      // create compiler
      const tsConfigFilePath = ts.findConfigFile(
        dirname(path),
        ts.sys.fileExists,
      );
      const compiler = new Compiler(tsConfigFilePath);

      // create snapshot
      snapshot = compiler.createSnapshot(path);
      snapshots.set(document, snapshot);
    }
    await snapshot.update(document.getText(), document.version);

    connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: snapshot.diagnostics.map(
        (diagnostics): Diagnostic => ({
          message: diagnostics.message,
          range: diagnostics.location
            ? Range.create(
                Position.create(
                  diagnostics.location.first_line,
                  diagnostics.location.first_column,
                ),
                Position.create(
                  diagnostics.location.last_line,
                  diagnostics.location.last_column,
                ),
              )
            : Range.create(Position.create(1, 1), Position.create(1, 2)),
        }),
      ),
    });
  }

  connection.onInitialize(() => {
    connection.console.log("onInitialize");

    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
      },
    };
  });

  connection.onHover(async (params) => {
    const document = documents.get(params.textDocument.uri)!;
    const snapshot = snapshots.get(document)!;

    await snapshot.synced;

    if (snapshot.compiled) {
      const sourceMap = await new SourceMapConsumer(
        snapshot.compiled.sourceMap,
      );
      const text = snapshot.compiled.code;

      console.log({
        original: {
          line: params.position.line + 1,
          column: params.position.character + 1,
        },
      });

      const generatedPosition = sourceMap.generatedPositionFor({
        line: params.position.line + 1,
        column: params.position.character + 1,
        source: sourceMap.sources[0]!,
      });

      console.log({
        generated: {
          line: generatedPosition.line,
          column: generatedPosition.column,
          lastColumn: generatedPosition.lastColumn!,
        },
      });

      const translate = (line: number, character: number) =>
        snapshot.sourceFile.compilerNode.getPositionOfLineAndCharacter(
          line,
          character,
        );

      try {
        console.log(
          '"' +
            text.slice(
              translate(generatedPosition.line!, generatedPosition.column!),
              translate(generatedPosition.line!, generatedPosition.lastColumn!),
            ) +
            '"',
        );
      } catch (error) {
        console.error(error);
      }

      return {
        contents: `${generatedPosition.line}:${generatedPosition.column}`,
      };
    } else {
      return {
        contents: "no generated content",
      };
    }
  });

  documents.listen(connection);
  connection.listen();

  connection.console.log("Listening...");
}
