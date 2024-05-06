# [KOLint](https://kolint.github.io/next/)

**The modern toolchain for enhancing usage of Knockout.js and improving runtime performance. [Read more ›](https://kolint.github.io/next/)**

## Analyzer

<!-- @include docs/parts/packages/analyzer/description.md -->

Code analyzer that can detect common issues in the code. The linter can also spit out type-checking errors provided by [TypeScript](https://www.typescriptlang.org/).

<!-- /include -->

<div align="center">

[Read more ›](https://kolint.github.io/next/analyzer/intro)

</div>

<!-- @include docs/parts/features/analyzer/gh-example.md -->

<!-- prettier-ignore -->
```html
<p data-bind="visible: isVisible"></p>
                       ^^^^^^^^^
Argument of type 'number' is not assignable to parameter of type 'boolean'.
```

<!-- /include -->

## Server-Side Rendering

<!-- @include docs/parts/packages/ssr/description.md -->

Pre-render knockout views on the server to optimize runtime performance and SEO.

<!-- /include -->

<div align="center">

[Read more ›](https://kolint.github.io/next/ssr/intro)

</div>

<!-- @include docs/parts/features/ssr/gh-example.md -->

<!-- prettier-ignore -->
```diff
- <!-- ko foreach: users -->
-   <p>{name}</p>
- <!-- /ko -->
+ <p>John Doe</p>
+ <p>Albert Einstein</p>
```

<!-- /include -->

## Language Support

<!-- @include docs/parts/packages/analyzer/description.md -->

Code analyzer that can detect common issues in the code. The linter can also spit out type-checking errors provided by [TypeScript](https://www.typescriptlang.org/).

<!-- /include -->

<div align="center">

[Read more ›](https://kolint.github.io/next/ssr/intro)

</div>
