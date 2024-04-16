import type { CheckOptions } from "./check.js";
import { pathToFileURL } from "node:url";

export interface Config extends CheckOptions {}

export async function loadConfig(path: string): Promise<Config> {
  const url = pathToFileURL(path).toString();
  return (await import(url)) as any;
}
