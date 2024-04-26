# Configuration

The linter will automatically detect and import the `kolint.config.js` module if it exists. You can also pass the `--config` flag to use a custom path.

:::warning
You need to use module syntax according to the [detected module system](https://nodejs.org/api/packages.html#packages_determining_module_system). If you want to use ESM syntax, you may need to use the `.mjs` extension.
:::

:::tip
If you pass the `--config` flag (with or without a path), the linter will fail unless the config file is resolved.
:::

---

**kolint.config.js**

```js
/**
 * @type {import('@kolint/check').Config}
 */
export default {
  include: ["**/*.html"],
  exclude: ["**/node_modules/"],
};
```
