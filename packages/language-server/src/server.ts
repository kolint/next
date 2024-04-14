import assert from "node:assert/strict";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  type Connection,
  createConnection,
  ProposedFeatures,
  TextDocuments,
} from "vscode-languageserver/node.js";

export interface LanguageServerOptions {
  connection?: Connection;
}

export function startLanguageServer(options?: LanguageServerOptions) {
  const connection =
    options?.connection ?? createConnection(ProposedFeatures.all);

  const documents = new TextDocuments(TextDocument);
  documents.listen(connection);

  connection.onInitialize(() => {
    return {
      capabilities: {},
    };
  });

  connection.onDocumentColor((params) => {
    const document = documents.get(params.textDocument.uri);
    assert(document);
  });
}
