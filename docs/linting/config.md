# Configuration

The linter will automatically detect and import the `kolint.config.js` module if it exists. You can also pass the `--config` flag to use a custom path or enforce loading the module.

:::warning
You need to use module syntax according to the [detected module system](https://nodejs.org/api/packages.html#packages_determining_module_system). If you want to use ESM syntax, you may need to use the `.mjs` extension.
:::

The config module configures the default options passed to the linter. They are always overwritten by the flags passed.

```js
/**
 * @type {import('@kolint/check').Config}
 */
export default {
  ...
};
```

## Files to include

When you pass a directory to the linter, it scans all `.html` files by default. Customize this behavior by setting the `include` and `exclude` fields using glob patterns."

:::info NOTE
When supplying the path to a single file to the linter, it will always be included, disregarding this configuration.
:::

```js
export default {
  // Only pick files that ends with ".view.html"
  include: ["**/*.view.html"], // [!code ++]
  // Exclude has higher priority, all files under the "dist/" directory is ignored.
  exclude: ["dist/**"], // [!code ++]
};
```

## Severity

You can configure the severity for every diagnostic, including TypeScript errors. The severity field is a map with the diagnostic code or name, and the severity `"off"`, `"warn"`, or `"error"`.

:::tip
If you have [the vscode extention](/package/readme/vscode) installed, the diagnostic code is shown when hovering the error in the editor.
:::

```js
export default {
  severity: {
    // The diagnostic is by default reported as an error.
    "no-viewmodel-reference": "warn", // [!code ++]
  },
};
```

## tsconfig

The linter will automatically resolve the tsconfig from the working directory (cwd) if the field is not provided.

```js
export default {
  tsconfig: "./path/to/tsconfig.json", // [!code ++]
};
```
