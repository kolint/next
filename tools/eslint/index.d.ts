import type eslint from "eslint";
import type ts from "typescript-eslint";

export type Config =
  | eslint.Linter.FlatConfig
  | readonly eslint.Linter.FlatConfig[];

export function config(
  configs: Parameters<typeof ts.config>,
): ReturnType<typeof ts.config>;

export function references(path: string): string[];
