// src
export {
  Diagnostic,
  Severity,
  diagnostics,
  type DiagnosticDescription,
} from "./diagnostic.js";
export { createProgram, Program, type Reporting } from "./program.js";
export * as utils from "./utils.js";

// src/compiler
export { type Compiler, createCompiler } from "./compiler/index.js";
export {
  type CompilerHost,
  createCompilerHost,
} from "./compiler/compiler-host.js";

// src/parser
export { parse } from "./parser/index.js";
export { createDocument } from "./parser/document-builder.js";
export type { Coordinates, Location, Position } from "./parser/location.js";
export * from "./parser/syntax-tree.js";
