import { check, type CheckOptions } from "../checker.js";
import logger, { createDebugFile, levels } from "../logger.js";
import { formatDiagnostic } from "../format-diagnostic.js";
import { importConfig, resolveConfigPath } from "./config.js";
import { Severity } from "@kolint/compiler";
import yargs from "yargs";

export function getConfigResolution(flag: unknown) {
  let resolution: "force" | "auto" | "disabled";
  let pattern: string | undefined;

  if (flag === undefined) {
    resolution = "auto";
  } else if (flag === true || flag === "true") {
    resolution = "force";
  } else if (flag === false || flag === "false") {
    resolution = "disabled";
  } else {
    resolution = "force";
    pattern = String(flag);
  }

  return {
    resolution,
    pattern,
  };
}

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
        description: "Prints debug info to kolint.debug.log.",
      },
      debugOutput: {
        type: "boolean",
        default: false,
        hidden: true,
      },
      verbose: {
        type: "boolean",
        default: false,
        description: "Output verbose info to console.",
      },
      logLevel: {
        type: "string",
        choices: Object.keys(levels),
        description: "Log level for the console.",
      },
    })
    .parse();

  logger.level = args.logLevel || (args.verbose && "verbose") || "info";
  if (args.debug) {
    logger.add(createDebugFile());
  }

  logger.debug(`Log level: ${logger.level}`);

  const configPath = await resolveConfigPath(getConfigResolution(args.config));
  const config = configPath ? await importConfig(configPath) : null;

  const options: CheckOptions = {
    ...config,
    debug: args.debugOutput,
  };
  logger.debug("Options:", config);

  const diagnostics = await check(args._.map(String), options);
  logger.debug("Diagnostics:", diagnostics);

  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === Severity.Off) continue;

    const level = (
      {
        [Severity.Warning]: "warn",
        [Severity.Error]: "error",
      } as const
    )[diagnostic.severity];

    const formatted = formatDiagnostic(diagnostic);
    logger.log(level, formatted);
  }
}
