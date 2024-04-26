# [KOLint](https://kolint.github.io/next/)

**The modern toolchain for enhancing usage of Knockout.js and improving runtime performance. [Read more ›](https://kolint.github.io/next/)**

## Linting

Code analyzer that can detect common issues in the code. The linter can also spit out type-checking errors provided by [TypeScript](https://www.typescriptlang.org/).

<div align="center">

[Read more ›](https://kolint.github.io/next/linting/intro)

</div>

<!-- prettier-ignore -->
```html
<p data-bind="visible: isVisible"></p>
                       ^^^^^^^^^
Argument of type 'number' is not assignable to parameter of type 'boolean'.
```

## Server-side Render

Pre-render knockout views on the server to optimize runtime performance and SEO.

<div align="center">

[Read more ›](https://kolint.github.io/next/ssr/intro)

</div>

<!-- prettier-ignore -->
```diff
- <!-- ko foreach: users -->
-   <p>{{ name }}</p>
- <!-- /ko -->
+ <p>John Doe</p>
+ <p>Albert Einstein</p>
```

## Language Support

A language server (implementing the [language server protocol](#https://microsoft.github.io/language-server-protocol/)) for Knockout.js to provide language features, such as intellisense, diagnostics, syntax highlighting, etc. mainly for editors.

<div align="center">

[Read more ›](https://kolint.github.io/next/ssr/intro)

</div>
