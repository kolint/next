import { Element } from "@kolint/parser";
import { type Plugin } from "../plugin.js";
import value from "./value.js";

const textInput: Plugin = {
  filter: (binding) =>
    binding.name === "textInput" && binding.parent instanceof Element,
  ssr: value.ssr,
};

export default textInput;
