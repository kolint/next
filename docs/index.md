---
layout: home

hero:
  name: KOLint
  text: Modern Toolchain for Knockout.js
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

features:
  - title: Linting
    details: Find common errors in your knockout views and type-check view with <b>TypeScript</b>.
    icon:
      src: /assets/icons/typescript.svg
      wrap: true
      width: 26px
      height: 26px
  - title: SSR
    details: Pre-render your views on the server to improve runtime performance and SEO.
    icon: ⚙️
  - title: Language Support
    details: The language server provides in-editor features.
    icon: 🔣
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
</style>

<br />
<br />
<hr />
<br />
