import { Severity, type Diagnostic } from "@kolint/compiler";
import { Chalk, supportsColor } from "chalk";
import { relative } from "node:path";

export type FormatDiagnosticOptions = {
  color?: boolean | "auto";
};

export function formatDiagnostic(
  diagnostic: Diagnostic,
  options?: FormatDiagnosticOptions,
) {
  const chalk = new Chalk({
    level:
      !options?.color || options.color === "auto"
        ? supportsColor
          ? supportsColor.level
          : 0
        : options?.color
          ? 1
          : 0,
  });

  const severity = diagnostic.severity === Severity.Error ? "error" : "warning";
  const location = diagnostic.location
    ? `${diagnostic.location.first_line}:${diagnostic.location.first_column}`
    : "";
  const path = relative(process.cwd(), diagnostic.filePath);
  const link = `${path}:${location}`;
  return `${link} ${chalk.red(severity)} ${chalk.grey(diagnostic.code)} ${diagnostic.message}`;
}
