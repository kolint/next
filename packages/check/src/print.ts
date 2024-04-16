import { Severity, type Diagnostic } from "@kolint/compiler";
import chalk from "chalk";
import { relative } from "node:path";

export function printDiagnostics(diagnostics: readonly Diagnostic[]) {
  for (const diag of diagnostics) {
    if (diag.severity === Severity.Off) continue;

    const severity = diag.severity === Severity.Error ? "error" : "warning";
    const location = diag.location
      ? `${diag.location.first_line}:${diag.location.first_column}`
      : "";
    const relativePath = relative(process.cwd(), diag.filePath);
    const link = `${relativePath}:${location}`;
    console[diag.severity === Severity.Error ? "error" : "log"](
      `${link} ${chalk.red(severity)} ${chalk.grey(diag.code)} ${diag.message}`,
    );
  }
}
