---
layout: home

hero:
  name: KOLint
  text: The Modern Toolchain for Knockout.js
  tagline: The modern toolchain for enhancing usage of Knockout.js and improving runtime performance.
  image:
    src: /logo.png
    alt: KOLint Shield
  actions:
    - theme: brand
      text: Introduction
      link: /intro
    - theme: alt
      text: View on GitHub
      link: https://github.com/kolint/next
---

<style>
:root {
  /* from rollupjs.org */
	--vp-home-hero-image-background-image: linear-gradient(
		-45deg,
		hsl(0 100% 60% / 80%),
		hsl(15 100% 60% / 80%) 40%,
		hsl(23 96% 62% / 80%) 45%,
		hsl(0 100% 60% / 80%) 60%,
		hsl(358 58% 47% / 80%)
	);
	--vp-home-hero-image-filter: blur(40px) opacity(0.5);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px) opacity(0.5);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px) opacity(0.5);
  }
}

.image-src {
  scale: 0.8;
  transform-origin: top left;
}

.index-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 32px;
}

.index-content h2:first-child {
  border: none;
}

</style>

<hr />

<div class="index-content">

## Linting

<!-- @include: @/parts/features/linting/description.md -->

<div align="center">

[Read more ›](/linting/intro)

</div>

<!-- @include: @/parts/features/linting/example.md -->

## Server-side Render {#ssr}

<!-- @include: @/parts/features/ssr/description.md -->

<div align="center">

[Read more ›](/ssr/intro)

</div>

<!-- @include: @/parts/features/ssr/example.md -->

## Language Support

<!-- @include: @/parts/features/language-support/description.md -->

<div align="center">

[Read more ›](/ssr/intro)

</div>

<!-- @include: @/parts/features/language-support/example.md -->

</div>
