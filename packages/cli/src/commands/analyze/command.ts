import command from "../../command.js";
import logger from "../../logger.js";
import {
  getConfigResolution,
  importConfig,
  resolveConfigPath,
} from "./config.js";
import { formatIssue } from "./format.js";
import { resolveFiles } from "./resolve-files.js";
import {
  Analyzer,
  type AnalyzerOptions,
  type AnalyzerSeverity,
  type AnalyzerPlugin,
} from "@kolint/analyzer";
import { readFile } from "node:fs/promises";

export default command({
  command: "analyze [entries...]",
  builder: (yargs) =>
    yargs
      .positional("entries", {
        type: "string",
        array: true,
      })
      .options({
        config: {
          alias: "c",
        },
        typeCheck: {
          alias: "ts",
        },
      }),
  handler: async (args) => {
    // Resolve config
    const configPath = await resolveConfigPath(
      getConfigResolution(args.config),
    );
    const config = configPath ? await importConfig(configPath) : null;
    logger.debug("Config:", config);

    // Setup analyzer
    const options: AnalyzerOptions = {
      attributes: config?.attributes,
      plugins: (await Promise.all(config?.plugins ?? [])).filter(
        (value): value is AnalyzerPlugin => !!value,
      ),
    };
    if (args.typeCheck) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      let exports: typeof import("@kolint/typescript/analyzer");
      try {
        exports = await import("@kolint/typescript/analyzer");
      } catch (error) {
        logger.debug(error);
        logger.error(
          'You need to install "@kolint/typescript" to run type checking.',
        );
        process.exit(1);
      }
      const { default: tsPlugin } = exports;
      options.plugins = [await tsPlugin(), ...(options.plugins ?? [])];
    }
    const analyzer = new Analyzer(options);

    // Resolve files
    logger.debug("Enties:", args.entries);
    if (!args.entries?.length) {
      logger.error("No inputs passed.");
      process.exit(1);
    }
    const files = await resolveFiles(args.entries, {
      include: config?.include,
      exclude: config?.exclude,
    });
    logger.debug("Files:", files);

    for (const fileName of files) {
      // Analyze file
      logger.debug("File:", fileName);
      const content = await readFile(fileName, "utf-8");
      const issues = await analyzer.analyze(fileName, content);
      logger.debug("Issues:", issues);

      // Report issues
      for (const issue of issues) {
        const setting = config?.rules?.[issue.name] ?? "on";
        if (setting === "off") continue;

        // Update issue severity
        issue.severity =
          setting === "on" ? issue.severity : (setting as AnalyzerSeverity);

        // Format issue
        const formatted = formatIssue(issue, {
          color: "auto",
          fileName,
        });

        // Log issue
        process.stderr.write(formatted + "\n");
      }
    }
  },
});
