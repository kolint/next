# Installation

The package supports NodeJS compatible runtimes.

::: code-group

```sh [npm]
$ npm add -D @kolint/analyzer
```

```sh [pnpm]
$ pnpm add -D @kolint/analyzer
```

```sh [yarn]
$ yarn add -D @kolint/analyzer
```

```sh [bun]
$ bun add -D @kolint/analyzer
```

:::

## TypeScript

The linter depends on TypeScript as a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies); Meaning that you can configure which version of TypeScript to use. Ensure you have it installed.

::: code-group

```sh [npm]
$ npm add -D typescript
```

```sh [pnpm]
$ pnpm add -D typescript
```

```sh [yarn]
$ yarn add -D typescript
```

```sh [bun]
$ bun add -D typescript
```

:::

## Usage

After you have [linked a viewmodel](#viewmodels) to a view, you can lint the file. You can choose to pass a directory or file to `kolint`.

:::tip
See `kolint --help` for all flags. You can also choose to [create a config file](/linting/config).
:::

::: code-group

```sh [npm]
$ npx kolint [options] [...paths]
```

```sh [pnpm]
$ pnpm kolint [options] [...paths]
```

```sh [yarn]
$ yarn kolint [options] [...paths]
```

```sh [bun]
$ bun kolint [options] [...paths]
```

:::
