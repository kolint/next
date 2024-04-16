import { dirname } from "node:path";
import ts from "typescript";

export function findTsConfigFilePath(searchPath: string) {
  if (!ts.sys.fileExists(searchPath)) {
    searchPath = dirname(searchPath);
  }
  return ts.findConfigFile(searchPath, ts.sys.fileExists);
}

export function getCompilerOptionsFromTsConfig(tsConfigFilePath: string) {
  const text = ts.sys.readFile(tsConfigFilePath);
  if (text === undefined) {
    throw new Error(`File ${tsConfigFilePath} does not exist.`);
  }
  const parseResult = ts.parseConfigFileTextToJson(tsConfigFilePath, text);
  if (parseResult.error != null) {
    throw new Error(parseResult.error.messageText.toString());
  }
  const result = ts.parseJsonConfigFileContent(
    parseResult.config!,
    ts.sys,
    dirname(tsConfigFilePath),
    undefined,
    tsConfigFilePath,
  );
  return result;
}

export { ts };
