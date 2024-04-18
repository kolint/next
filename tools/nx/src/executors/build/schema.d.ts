import { AssetGlob } from "@nx/js/src/utils/assets/assets";
import { Format, Options } from "tsup";

export interface BuildExecutorSchema {
  format?: Format | readonly Format[];
  entry?: string | readonly string[];
  outputPath: string;
  assets?: (string | AssetGlob)[];
  tsup?: Options | readonly Options[];
  package?: any;
  tsconfig?: string;
  declaration?: boolean;
  sourceMap?: boolean;
}
