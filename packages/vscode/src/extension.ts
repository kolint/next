import { ExtensionContext } from "vscode";
import {
  ForkOptions,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node.js";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  console.log("activate");

  const serverModule = context.asAbsolutePath("language-server.cjs");
  console.log(serverModule);
  const debugOptions: ForkOptions = {
    execArgv: ["--nolazy", "--inspect=6009"],
  };

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      {
        scheme: "file",
        language: "html",
      },
    ],
  };

  client = new LanguageClient(
    "kolintLanguageServer",
    "Kolint Language Server",
    serverOptions,
    clientOptions,
  );

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  console.log("deactivate");

  if (!client) {
    return undefined;
  }
  return client.stop();
}
