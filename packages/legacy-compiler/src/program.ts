import { Diagnostic } from "./diagnostic.js";
import { SourceMapGenerator } from "source-map";

export interface Reporting {
  diagnostics: Diagnostic[]
  registerOutput(filename: string, code: string, map: SourceMapGenerator): void;
  addDiagnostic(...diags: Diagnostic[]): void;
  disableAllDiagnostics(): void;
  disableDiagnostics(keys: string[]): void;
  enableAllDiagnostics(): void;
  enableDiagnostics(keys: string[]): void;
}

export function createProgram(): Program {
  return new Program();
}

/**
 * Manages diagnostics and outputs.
 */
export class Program implements Reporting {
  diagnostics: Diagnostic[] = [];

  private diagnosticsDisabled = false;
  private disabledDiagnostics: string[] = [];
  private enabledDiagnostics: string[] = [];

  private diagIsRule(rules: string[], diag: Diagnostic) {
    return rules.includes(diag.code) || rules.includes(diag.name);
  }

  public addDiagnostic(...diags: Diagnostic[]): void {
    if (this.diagnosticsDisabled) {
      this.diagnostics = this.diagnostics.concat(
        diags.filter((diag) => this.diagIsRule(this.enabledDiagnostics, diag)),
      );
    } else {
      this.diagnostics = this.diagnostics.concat(
        diags.filter(
          (diag) => !this.diagIsRule(this.disabledDiagnostics, diag),
        ),
      );
    }
  }

  registerOutput: (
    filename: string,
    code: string,
    map: SourceMapGenerator,
  ) => void = () => {};

  // Disable all diags
  public disableAllDiagnostics(): void {
    this.diagnosticsDisabled = true;
    this.enabledDiagnostics = [];
  }

  // Disable diags for keys
  public disableDiagnostics(keys: string[]): void {
    if (this.diagnosticsDisabled) {
      this.enabledDiagnostics = this.enabledDiagnostics.filter(
        (diag) => !keys.includes(diag),
      );
    } else {
      this.disabledDiagnostics = this.disabledDiagnostics.concat(keys);
    }
  }

  // Enable all diagnostics
  public enableAllDiagnostics(): void {
    this.diagnosticsDisabled = false;
    this.disabledDiagnostics = [];
  }

  // Enable diagnostics for specified keys
  public enableDiagnostics(keys: string[]): void {
    if (this.diagnosticsDisabled) {
      this.enabledDiagnostics = this.enabledDiagnostics.concat(keys);
    } else {
      this.disabledDiagnostics = this.disabledDiagnostics.filter(
        (diag) => !keys.includes(diag),
      );
    }
  }
}
