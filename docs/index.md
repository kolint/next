---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Kolint"
  text: "A VitePress Site"
  tagline: My great project tagline
  image:
    src: /assets/logo.png
    alt: Kolint
  actions:
    - theme: brand
      text: Markdown Examples
      link: /markdown-examples
    - theme: alt
      text: API Examples
      link: /api-examples

features:
  - title: Feature A
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature B
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature C
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---

<style>
:root {
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #BD5C28 50%, #CA712C 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}

.image-src {
  scale: 0.8;
  transform-origin: top left;
}
</style>
