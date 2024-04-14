import "../../src/runtime/index.ts";
import viewModel from "./viewmodel.js";
import ko from "knockout";

ko.applyBindings(viewModel, document.body);
