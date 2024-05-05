import { fileURLToPath } from "node:url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  type Connection,
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  type Diagnostic,
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
      const tsConfigFilePath = findTsConfigFilePath(path);
      const compilerOptions = tsConfigFilePath
        ? getCompilerOptionsFromTsConfig(tsConfigFilePath).options
        : ts.getDefaultCompilerOptions();
      const compiler = new Compiler(compilerOptions);

      // create snapshot
      snapshot = await compiler.createSnapshot(path, document.getText());
      snapshots.set(document, snapshot);
    }
    const diagnostics = await snapshot.compiler.check(snapshot);

    connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: diagnostics.map(
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

  documents.listen(connection);
  connection.listen();

  connection.console.log("Listening...");
}
