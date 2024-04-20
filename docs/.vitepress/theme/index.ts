// https://vitepress.dev/guide/extending-default-theme
import "./custom.css";
import DefaultTheme, { DefaultTheme as DefaultThemeNs } from "vitepress/theme";

export default DefaultTheme;

export interface ThemeConfig extends Omit<DefaultThemeNs.Config, "footer"> {
  footer: {
    links: FooterLink[];
    disclaimer: string;
  };
}

export interface FooterLink {
  text: string;
  link: string;
}
