import { createContentLoader } from "vitepress";

export default createContentLoader("../contributing.md", {
  render: true,
});
