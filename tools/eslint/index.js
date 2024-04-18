// @ts-nocheck
import { readFileSync } from "fs";
import { resolve, dirname } from "node:path";
import stripJsonComments from "strip-json-comments";
import ts from "typescript-eslint";

export function config(configs) {
  return ts.config(...configs);
}

export function references(path) {
  const config = JSON.parse(stripJsonComments(readFileSync(path, "utf8")));
  const paths =
    config.references?.flatMap((reference) =>
      references(resolve(dirname(path), reference.path)),
    ) ?? [];
  if (!(config.include && config.include.length === 0)) {
    paths.push(path);
  }
  return paths;
}
