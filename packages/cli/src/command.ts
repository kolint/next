import type common from "./common.js";
import type { Argv, CommandModule } from "yargs";

export type Command<U> =
  ReturnType<typeof common> extends Argv<infer T> ? CommandModule<T, U> : never;

export default function command<T>(command: Command<T>): Command<T> {
  return command;
}
