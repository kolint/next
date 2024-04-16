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
export { Compiler } from "./compiler/compiler.js";

// src/parser
export { parse } from "./parser/index.js";
export { createDocument } from "./parser/document-builder.js";
export type { Coordinates, Location, Position } from "./parser/location.js";
export * from "./parser/syntax-tree.js";
