import { ThemeConfig } from "./theme";
import escapeStringRegexp from "escape-string-regexp";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { UserConfig } from "vitepress";
import footnote from "markdown-it-footnote";

// https://vitepress.dev/reference/site-config
const config: UserConfig<ThemeConfig> = {
  title: "Kolint",
  base: "/next/",
  lastUpdated: true,

  // prettier-ignore
  head: [
    ['link', { rel: 'apple-touch-icon', sizes: "180x180", href: "/apple-touch-icon.png" }],
    ['link', { rel: 'icon', type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" }],
    ['link', { rel: 'icon', type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" }],
  ],

  themeConfig: {
    logo: "/logo.png",
    search: { provider: "local" },
    editLink: {
      pattern: "https://github.com/kolint/next/edit/main/docs/:path",
    },

    nav: [
      //
      { text: "Docs", link: "/intro" },
    ],

    sidebar: [
      {
        text: "Toolchain",
        items: [
          //
          { text: "Introduction", link: "/intro" },
        ],
      },
      {
        text: "Linting",
        collapsed: false,
        base: "/linting/",
        items: [
          //
          { text: "Introduction", link: "intro" },
          { text: "Getting Started", link: "setup" },
          { text: "Usage", link: "usage" },
          { text: "Configuration", link: "config" },
        ],
      },
      {
        text: "SSR",
        collapsed: false,
        base: "/ssr/",
        items: [
          //
          { text: "Introduction", link: "intro" },
          { text: "Getting Started", link: "setup" },
          { text: "Usage", link: "usage" },
          { text: "Support", link: "support" },
          { text: "Plugins", link: "plugins" },
        ],
      },
      {
        text: "Editors",
        collapsed: false,
        items: [
          {
            text: "VSCode Extension",
            link: "/package/readme/vscode",
          },
        ],
      },
      {
        text: "Development",
        collapsed: false,
        items: [
          //
          { text: "Contributing", link: "/contributing" },
        ],
      },
      {
        text: "Packages",
        collapsed: true,
        items: readdirSync("packages").map((name) => {
          return {
            text: name,
            link: `/package/readme/${name}`,
            collapsed: true,
            items: [
              ...(existsSync(`packages/${name}/README.md`)
                ? [{ text: "Readme", link: `/package/readme/${name}` }]
                : []),
              ...(existsSync(`packages/${name}/CHANGELOG.md`)
                ? [{ text: "Changelog", link: `/package/changelog/${name}` }]
                : []),
            ],
          };
        }),
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/kolint/next" }],

    footer: {
      links: [
        {
          text: "Repository",
          link: "https://github.com/kolint/next",
        },
        {
          text: "Releases",
          link: "https://github.com/kolint/next/releases",
        },
        {
          text: "Documentation",
          link: "/intro",
        },
      ],
      disclaimer:
        "Released under MIT License | Copyright © 2024 Elias Skogevall",
    },
  },

  markdown: {
    config: (md) => {
      md.use(footnote);
    },
  },

  vite: {
    resolve: {
      alias: readdirSync(
        fileURLToPath(new URL("./theme/components/", import.meta.url)),
        { withFileTypes: true },
      )
        .filter((entry) => entry.isFile() && entry.name.endsWith(".vue"))
        .map((entry) => ({
          find: new RegExp(`^.*\\/${escapeStringRegexp(entry.name)}$`),
          replacement: join(entry.path, entry.name),
        })),
    },
  },
};
export default config;
