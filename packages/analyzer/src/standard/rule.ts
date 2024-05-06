import type { AnalyzeContext, AnalyzerSeverity } from "../plugin.js";

export interface Rule {
  name: string;
  severity: AnalyzerSeverity;
  check(context: AnalyzeContext): void | PromiseLike<void>;
}
