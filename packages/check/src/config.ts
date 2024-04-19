import type { CheckOptions } from "./check.js";
import { pathToFileURL } from "node:url";

export interface Config extends CheckOptions {}

export async function loadConfig(path: string) {
  const url = pathToFileURL(path).toString();
  return interop(await import(url)) as Config;
}

function interop(module: object): unknown {
  return Object.hasOwn(module, "default")
    ? (module as { default?: unknown }).default
    : module;
}
