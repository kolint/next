// import { Snapshot } from "@kolint/snapshot";
// import assert from "node:assert/strict";
// import { basename } from "node:path";
// import { fileURLToPath } from "node:url";
import { Snapshot } from "@kolint/snapshot";
import assert from "node:assert/strict";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  type Connection,
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  TextDocumentIdentifier, // TextDocumentIdentifier,
} from "vscode-languageserver/node.js";

export interface LanguageServerOptions {
  connection?: Connection;
}

export function startLanguageServer(options?: LanguageServerOptions) {
  const connection =
    options?.connection ?? createConnection(ProposedFeatures.all);
  const documents = new TextDocuments(TextDocument);

  const snapshots = new WeakMap<TextDocument, Snapshot>();
  async function getSnapshot(document: TextDocument) {
    let snapshot = snapshots.get(document);

    if (snapshot) {
      if (snapshot.version !== document.version) {
        snapshot.update(document.getText(), document.version);
      }
    } else {
      const filename = basename(fileURLToPath(document.uri));
      snapshot = await Snapshot.from(document.getText(), filename);
      snapshot.version = document.version;
    }

    return snapshot;
  }

  async function getDocumentAndSnapshot(
    textDocument: TextDocumentIdentifier,
  ): Promise<{
    document: TextDocument;
    snapshot: Snapshot;
  }> {
    const document = documents.get(textDocument.uri);
    assert(document);
    const snapshot = await getSnapshot(document);
    return { document, snapshot };
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
    connection.console.log("onHover");
    const { snapshot } = await getDocumentAndSnapshot(
      params.textDocument,
    );
    connection.console.log("finish");

    console.log(snapshot.tsContent);

    return {
      contents: "Hello world!",
    };
  });

  documents.listen(connection);
  connection.listen();

  connection.console.log("Listening...");
}
