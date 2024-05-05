import { Snapshot } from "@kolint/analyzer";
import {
  defaultConfig,
  discoverConfigFile,
  readConfigFile,
} from "@kolint/config";
import { Transpiler } from "@kolint/typescript";
import { fileURLToPath } from "node:url";
import { type LanguageService, type SourceFile } from "ts-morph";
import * as ts from "typescript/lib/tsserverlibrary.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  type Connection,
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node.js";

const UPDATE_DEBOUNCE = 1000;

export interface LanguageServerOptions {
  connection?: Connection;
}

class SharedResourcesProvider {
  async getConfig(path: string) {
    const koConfigFilePath = await discoverConfigFile(path);
    const koConfig = koConfigFilePath
      ? await readConfigFile(koConfigFilePath)
      : defaultConfig;
    return koConfig;
  }

  getTranspiler(path: string) {
    const tsConfigFilePath = ts.findConfigFile(path, ts.sys.fileExists);

    const transpiler = new Transpiler({
      tsConfig: tsConfigFilePath,
    });

    return transpiler;
  }
}

interface DocumentState {
  snapshot: Snapshot;
  sourceFile: SourceFile;
  service: LanguageService;
  document: TextDocument;
}

interface DocumentStateProvider {
  getState(): Promise<DocumentState>;
  onChange(): void;
  dispose(): void;
}

async function updateDocumentState(
  provider: SharedResourcesProvider,
  document: TextDocument,
): Promise<DocumentState> {
  const path = fileURLToPath(document.uri);
  const original = document.getText();

  const config = await provider.getConfig(path);

  const transpiler = provider.getTranspiler(path);
  const { generated, sourceMap, sourceFile } = transpiler.transpile(
    path,
    original,
    config.analyzer.mode,
  );

  const snapshot = await new Snapshot({
    fileName: path,
    original,
    generated,
    sourceMap,
  });

  const project = sourceFile.getProject();
  const service = project.getLanguageService();

  return {
    document,
    snapshot,
    sourceFile,
    service,
  };
}

function createDocumentStateProvider(
  provider: SharedResourcesProvider,
  document: TextDocument,
): DocumentStateProvider {
  let statePromise = updateDocumentState(provider, document);

  const onChange = createDebounce(() => {
    statePromise = updateDocumentState(provider, document);
  }, UPDATE_DEBOUNCE);

  const documentStateProvider: DocumentStateProvider = {
    getState: () => {
      return statePromise;
    },

    onChange,

    dispose: () => {
      onChange.cancel();
    },
  };

  return documentStateProvider;
}

interface Debounce {
  (): void;
  cancel(): void;
}

function createDebounce(callback: () => void, timeout: number): Debounce {
  let id: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => clearTimeout(id);

  return Object.assign(
    () => {
      cancel();
      id = setTimeout(callback, timeout);
    },
    {
      cancel,
    },
  );
}

export function startLanguageServer(options?: LanguageServerOptions) {
  const connection =
    options?.connection ?? createConnection(ProposedFeatures.all);
  const documents = new TextDocuments(TextDocument);

  const sharedResourcesProvider = new SharedResourcesProvider();
  const snapshotProviderMap = new WeakMap<
    TextDocument,
    DocumentStateProvider
  >();

  // const getDocumentState = (documentId: TextDocumentIdentifier) => {
  //   const document = documents.get(documentId.uri)!;
  //   const provider = createDocumentStateProvider(
  //     sharedResourcesProvider,
  //     document,
  //   );
  //   return provider.getState();
  // };

  documents.onDidOpen(async (event) => {
    const provider = createDocumentStateProvider(
      sharedResourcesProvider,
      event.document,
    );
    snapshotProviderMap.set(event.document, provider);
  });

  documents.onDidChangeContent(async (event) => {
    const provider = snapshotProviderMap.get(event.document);
    provider?.onChange();
  });

  documents.onDidClose((event) => {
    const provider = snapshotProviderMap.get(event.document);
    provider?.dispose();
    snapshotProviderMap.delete(event.document);
  });

  connection.onInitialize(() => {
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
      },
    };
  });

  documents.listen(connection);
  connection.listen();

  connection.console.log("Listening...");
}
