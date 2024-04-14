import { CopyAssetsOptions } from "@nx/js/src/utils/assets/assets";
import { Options } from "tsup";

export interface TsupExecutorSchema {
  includeDevDependencies?: readonly string[];
  entry?: string | readonly string[];
  tsup?: Options;
  outputPath?: string;
  assets?: CopyAssetsOptions;
  exports: any;
  types?: string;
}
