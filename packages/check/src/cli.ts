import { check, type CheckOptions } from "./check.js";
import { loadConfig } from "./config.js";
import logger, { createDebugFile, levels } from "./logger.js";
import { formatDiagnostic } from "./print.js";
import { Severity } from "@kolint/compiler";
import { globby } from "globby";
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

  let configResolution: "force" | "auto" | "disabled";
  let configPattern = "kolint.config.js";

  if (args.config === undefined) {
    configResolution = "auto";
  } else if (args.config === true || args.config === "true") {
    configResolution = "force";
  } else if (args.config === false || args.config === "false") {
    configResolution = "disabled";
  } else {
    configResolution = "force";
    configPattern = String(args.config);
  }

  logger.debug(`Config resolution: ${configResolution}.`);
  logger.debug(`Config pattern: ${configPattern}.`);

  let configPath: string | undefined;

  if (configResolution === "force" || configResolution === "auto") {
    const configPaths = await globby(configPattern, {
      dot: true,
      absolute: true,
    });

    if (configPaths.length > 1) {
      logger.error(
        "Found multiple config files:" +
          configPaths.map((path) => `\n  - ${path}`),
      );
      process.exit(1);
    }

    configPath = configPaths[0];

    if (configPath) {
      logger.verbose(`Config path: ${configPath}`);
    } else {
      logger.verbose("No config file found.");
    }

    if (configResolution === "force" && !configPath) {
      logger.error(`Unable to resolve config file: ${configPattern}`);
      process.exit(1);
    }
  }

  const config = configPath ? await loadConfig(configPath) : undefined;
  logger.debug("Config:", config);

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
