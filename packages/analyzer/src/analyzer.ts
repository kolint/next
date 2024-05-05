import type { AnalyzerIssue } from "./issue.js";
import type { AnalyzerPlugin, AnalyzeContext } from "./plugin.js";
import standard from "./standard/plugin.js";
import { parse } from "@kolint/parser";

export interface AnalyzerOptions {
  plugins?: readonly AnalyzerPlugin[];
  attributes?: readonly string[];
}

export default class Analyzer {
  #plugins = new Set<AnalyzerPlugin>();
  #attributes: readonly string[];

  constructor(options?: AnalyzerOptions) {
    this.#attributes = options?.attributes ?? ["data-bind"];

    const unsortedPlugins = [...(options?.plugins ?? []), standard()];
    for (const plugin of unsortedPlugins) {
      if (plugin.dependencies) {
        for (const [name, value] of Object.entries(plugin.dependencies)) {
          if (!value) continue;
          const { optional } = value;

          const dependency = unsortedPlugins.find(
            (plugin) => plugin.name === name,
          );

          if (optional === false && !dependency) {
            throw new Error(
              `Plugin "${plugin.name}" is dependant on "${name}".`,
            );
          }

          if (dependency) {
            this.#plugins.add(dependency);
          }
        }
      }
      this.#plugins.add(plugin);
    }
  }

  async analyze(fileName: string, text: string): Promise<AnalyzerIssue[]> {
    const issues: AnalyzerIssue[] = [];

    const document = parse(text, {
      bindingAttributes: this.#attributes,
    });

    const context: AnalyzeContext = {
      fileName,
      text,
      document,
      snapshots: {
        javascript: undefined!,
      },
      report(issue) {
        issues.push(issue);
      },
    };

    for (const plugin of this.#plugins) {
      await plugin.analyze(context);
    }

    return issues;
  }
}
