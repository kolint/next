import type {
  CommonBindingContextTransforms,
  BindingContextIdentityTransform,
} from "./common";

export interface StandardBindingContextTransforms
  extends CommonBindingContextTransforms {
  text: BindingContextIdentityTransform<string | null | undefined>;
}

export declare const $: StandardBindingContextTransforms;

export * from "./common";
