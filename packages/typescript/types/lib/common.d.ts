import type * as ko from "knockout";

//#region ko types
// subscribable
export interface Subscribable<T> {
  subscribe: (...args: any[]) => any;
}
export type MaybeSubscribable<T> = T | Subscribable<T>;

// computed
export interface Computed<T> {
  (): T;
  (value: T): this;
}
export type PureComputed<T> = Computed<T>;
export type MaybeComputed<T> = T | Computed<T> | PureComputed<T>;

// observable
export type Observable<T> = ko.Observable<T>;
export type ReadonlyObservable<T> = (
  | ko.ObservableFunctions<T>
  | ko.ComputedFunctions<T>
) & { (): T };
export type MaybeObservable<T> = ko.MaybeObservable<T>;
export type MaybeReadonlyObservable<T> = T | ReadonlyObservable<T>;

// observable array
export type ObservableArray<T> = ko.ObservableArray<T>;
export type ReadonlyObservableArray<T> = ReadonlyObservable<T[]>;
export type MaybeObservableArray<T> = T[] | ObservableArray<T>;
export type MaybeReadonlyObservableArray<T> =
  | readonly T[]
  | ReadonlyObservableArray<T>;

export type MaybeReactive<T> = ko.MaybeComputed<T> | ko.MaybeObservable<T>;
//#endregion

//#region binding context
export type BindingContext<
  ViewModel = any,
  ParentContext extends BindingContext = any,
  Parent = any,
  Root = any,
  Ancestors extends [...any, Root] = [...any, any],
> =
  | RootBindingContext<ViewModel>
  | ChildBindingContextImpl<ViewModel, ParentContext, Parent, Root, Ancestors>;

export interface RootBindingContext<ViewModel> {
  $parents: [];
  $root: ViewModel;
  $data: ViewModel;
  $rawData: MaybeReactive<ViewModel>;
}

export interface ChildBindingContextImpl<
  ViewModel,
  ParentContext extends BindingContext,
  Parent,
  Root,
  Ancestors extends BindingContext[],
> {
  $parentContext: ParentContext;
  $parents: [Parent, ...Ancestors];
  $parent: Parent;
  $root: Root;
  $data: ViewModel;
  $rawData: MaybeReactive<ViewModel>;
}

// Use parent context and override with child context parameters
export type ChildBindingContext<
  ViewModel,
  Parent extends BindingContext,
> = Parent &
  ChildBindingContextImpl<
    ViewModel,
    Parent,
    Parent["$data"],
    Parent["$root"],
    [...Parent["$parents"]]
  >;
//#endregion

export interface BindingHandler<T> {
  init?: (
    element: any,
    valueAccessor: () => T,
    allBindings?: any,
    viewModel?: any,
    bindingContext?: any,
  ) => any;
  update?: (
    element: any,
    valueAccessor: () => T,
    allBindings?: any,
    viewModel?: any,
    bindingContext?: any,
  ) => void;
}

export interface ControlFlowBindingHandler<T> extends BindingHandler<T> {
  transformContext(data?: unknown, parentContext?: BindingContext): object;
}

/** The parent binding context to child binding context transformation (the transformation function) */
export type BindingContextTransformation<
  T,
  ChildContext extends <Parent>(parent: Parent) => object,
> = <ParentContext>(
  value: MaybeReadonlyObservable<T>,
  parentContext: ParentContext,
) => ChildContext extends <Parent>(parent: Parent) => infer R ? R : never;

/**
 * Child binding context from control flow binding handler context transformation (transformContext).
 * Requires the new data type and parent binding context
 */
export type ChildBindingContextTransform<
  T extends (...args: any[]) => any,
  Data,
  ParentContext,
> = T extends (data?: Data, parentContext?: ParentContext) => infer R
  ? R
  : never;

/** The parent binding context to child binding context transformation (the transformation function) */
export type ChildBindingContextTransformation<
  Handler extends ControlFlowBindingHandler<any>,
> = <Parent>(
  parent: Parent,
) => ChildBindingContextTransform<
  Handler["transformContext"],
  BindingHandlerType<Handler>,
  Parent
>;

/** The binding context transform of any bindinghandler */
export type BindingContextTransform<Handler extends BindingHandler<any>> =
  Handler extends ControlFlowBindingHandler<any>
    ? BindingContextTransformation<
        BindingHandlerType<Handler>,
        ChildBindingContextTransformation<Handler>
      >
    : BindingContextIdentityTransform<BindingHandlerType<Handler>>;

/** The type of any binding handler */
export type BindingHandlerType<Handler extends BindingHandler<unknown>> =
  Handler extends BindingHandler<infer U> ? U : never;

/** Base type for normal binding handlers that does not control descendant bindings */
export type BindingContextIdentityTransform<V> = <Context>(
  value: MaybeReadonlyObservable<V>,
  ctx: Context,
) => Context;

export interface CommonBindingContextTransforms {
  visible: BindingContextIdentityTransform<boolean>;
  hidden: BindingContextIdentityTransform<boolean>;
  html: BindingContextIdentityTransform<string>;
  class: BindingContextIdentityTransform<string>;
  css: BindingContextIdentityTransform<
    string | Record<string, MaybeReadonlyObservable<boolean>>
  >;
  style: BindingContextIdentityTransform<
    Record<string, MaybeReadonlyObservable<string>>
  >;
  // TODO: Create types for the standard attributes
  attr: BindingContextIdentityTransform<
    Record<string, MaybeReadonlyObservable<unknown>>
  >;
  event: BindingContextIdentityTransform<{
    [key in keyof WindowEventMap]?: (
      data: any,
      event: WindowEventMap[key],
    ) => any;
  }>;
  click: BindingContextIdentityTransform<
    (data: any, event: MouseEvent) => void
  >;
  submit: BindingContextIdentityTransform<(form: HTMLFormElement) => void>;
  enable: BindingContextIdentityTransform<boolean>;
  disable: BindingContextIdentityTransform<boolean>;
  value: BindingContextIdentityTransform<any>;

  // Use this definition if the function can be guaranteed to return const string.
  // TODO: Revisit
  // valueUpdate: BindingContextIdentityTransform<'input' | 'keyup' | 'keypress' | 'afterkeydown'>
  valueUpdate: BindingContextIdentityTransform<string>;

  valueAllowUnset: BindingContextIdentityTransform<boolean>;
  textInput: BindingContextIdentityTransform<string>;
  hasFocus: BindingContextIdentityTransform<any>;
  checked: BindingContextIdentityTransform<any>;
  checkedValue: BindingContextIdentityTransform<any>;
  options: BindingContextIdentityTransform<any>;
  optionsText: BindingContextIdentityTransform<string>;
  optionsCaption: BindingContextIdentityTransform<string>;
  optionsValue: BindingContextIdentityTransform<string>;
  selectedOptions: BindingContextIdentityTransform<any>;
  uniqueName: BindingContextIdentityTransform<boolean>;
  template: BindingContextIdentityTransform<any>;
  component: BindingContextIdentityTransform<
    string | { name: any; params: any }
  >;
  if: BindingContextIdentityTransform<unknown>;
  ifnot: BindingContextIdentityTransform<unknown>;

  foreach: <const Key extends string, VM, Context extends BindingContext>(
    value:
      | { data: MaybeReadonlyObservableArray<VM>; as: Key }
      | MaybeReadonlyObservableArray<VM>,
    parentContext: Context,
  ) => Key extends string
    ? ChildBindingContext<VM, Context> & {
        $index: Observable<number>;
      } & Record<Key, VM>
    : ChildBindingContext<VM, Context> & {
        $index: Observable<number>;
      };

  using: CommonBindingContextTransforms["with"];
  with: <V extends object, Context extends BindingContext>(
    value: MaybeObservable<V>,
    parentContext: Context,
  ) => ChildBindingContext<V, Context>;
  let: <T extends object, Context extends BindingContext>(
    value: MaybeObservable<T>,
    parentContext: Context,
  ) => Context & T;
}

type Instanciate<T> = T extends () => infer U ? U : T;
export type Interop<T> = Instanciate<T extends { default: infer U } ? U : T>;
