import type { Config } from "../config.js";
import logger from "../logger.js";
import { globby } from "globby";
import { pathToFileURL } from "node:url";

export async function importConfig(path: string) {
  const url = pathToFileURL(path).toString();
  const module = await import(url);
  const config = (
    Object.hasOwn(module, "default")
      ? (module as { default?: unknown }).default
      : module
  ) as Config;
  logger.debug("Config:", config);
  return config;
}

export async function resolveConfigPath({
  pattern = "kolint.config.{js,cjs,mjs,ts,cts,mts}",
  resolution = "auto",
  directory = ".",
}:
  | Readonly<{
      pattern?: string | undefined;
      resolution?: "force" | "auto" | "disabled" | undefined;
      directory?: string | undefined;
    }>
  | undefined = {}): Promise<string | null> {
  logger.debug(`Config resolution: ${resolution}.`);
  logger.debug(`Config pattern: ${pattern}.`);

  if (resolution === "disabled") {
    return null;
  }

  const paths = await globby(pattern, {
    dot: true,
    absolute: true,
    cwd: directory,
  });

  if (paths.length > 1) {
    throw new Error(
      "Found multiple config files:" + paths.map((path) => `\n  - ${path}`),
    );
  }

  const path = paths[0] ?? null;

  if (path) {
    logger.verbose(`Config path: ${path}`);
  } else if (resolution === "force") {
    throw new Error(`Unable to resolve config file: ${pattern}`);
  } else {
    logger.verbose("No config file found.");
  }

  return path;
}
