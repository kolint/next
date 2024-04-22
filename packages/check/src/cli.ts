import { check, type CheckOptions } from "./check.js";
import { loadConfig } from "./config.js";
import { printDiagnostics } from "./print.js";
import { access } from "node:fs/promises";
import yargs from "yargs";

export default async function (
  argv: readonly string[] = process.argv.slice(2),
) {
  const args = await yargs(argv)
    .scriptName("kolint")
    .usage("kolint [...paths]")
    .options({
      config: {
        alias: "c",
      },
      debug: {
        type: "boolean",
        default: false,
      },
    })
    .parse();

  let configPath: string | undefined;

  if (
    args.config === undefined ||
    args.config === true ||
    args.config === "true"
  ) {
    configPath = "kolint.config.js";
  } else if (args.config === false || args.config === "false") {
    configPath = undefined;
  } else if (args.config) {
    configPath = String(args.config);
  }

  if (configPath) {
    try {
      await access(configPath);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.error(`Config ${args.config} does not exist.`);
      } else {
        throw error;
      }
    }
  }

  const config = configPath ? await loadConfig(configPath) : undefined;
  const options: CheckOptions = {
    ...config,
    debug: args.debug,
  };

  const diagnostics = await check(args._.map(String), options);

  printDiagnostics(diagnostics);
}
