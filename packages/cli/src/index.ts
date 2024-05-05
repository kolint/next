import commands from "./commands.js";
import cli from "./common.js";
import type { CommandModule } from "yargs";

export default async function (argv: readonly string[], cwd = process.cwd()) {
  const instance = cli(argv, cwd);

  for (const module of commands) {
    instance.command(module.default as CommandModule);
  }

  await instance.parse();
}
