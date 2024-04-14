export interface BunTestExecutorSchema {
  timeout?: number;
  updateSnapshots?: boolean;
  rerunEach?: number;
  only?: boolean;
  todo?: boolean;
  coverage?: boolean;
  bail?: boolean | number;
  testNamePattern?: string;
  pattern?: string | readonly string[];
}
