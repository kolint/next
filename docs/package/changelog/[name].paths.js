import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export default {
  paths() {
    return readdirSync("packages", { withFileTypes: true }).map((entry) => {
      let content;
      try {
        content = readFileSync(
          join(entry.path, entry.name, "CHANGELOG.md"),
          "utf8",
        );
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
      return { params: { name: entry.name }, content };
    });
  },
};
