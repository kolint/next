# Configuration

The toolchain shares the same configuration file. The tools will automatically detect and import the `ko.config.js` module if it exists. You can also pass the `--config` flag to use a custom path or enforce loading the module.

## Installation

If you want to check types or get smarter suggestions while coding, you need to add the `@kolint/config` package.

::: code-group

```sh [npm]
$ npm add -D @kolint/config
```

```sh [pnpm]
$ pnpm add -D @kolint/config
```

```sh [yarn]
$ yarn add -D @kolint/config
```

```sh [bun]
$ bun add -D @kolint/config
```

## Usage

:::

:::warning
You need to use module syntax according to the [detected module system](https://nodejs.org/api/packages.html#packages_determining_module_system). If you want to use ESM syntax, you may need to use the `.mjs` extension.
:::

Create the file `ko.config.js` and copy the below contents as a placeholder. The file will be automatically detected.

```js
/**
 * @type {import('@kolint/config').Config}
 */
export default {
  ...
};
```

## Common

### Binding Attributes

The setting configures what attributes to interpret as Knockout bindings. If the option is defined, `"data-bind"` needs to be explicitly added.

```js
export default {
  attributes: [
    "data-bind",
    "data-i18n", // [!code ++]
  ]
};
```
