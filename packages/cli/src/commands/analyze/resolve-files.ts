import { globby } from "globby";
import { access, stat } from "node:fs/promises";

const DEFAULT_EXCLUDE = [
  "**/node_modules/**",
  "**/web_modules/**",
  "**/bower_components/**",
  "**/.DS_Store/**",
  "**/.git/**",
];

export interface ResolveFilesOptions {
  include?: string | readonly string[];
  exclude?: string | readonly string[];
}

export async function resolveFiles(
  args: string[],
  options?: ResolveFilesOptions,
) {
  return (
    await Promise.all(
      args.map(async (arg) => {
        try {
          await access(arg);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            console.error(`Path '${arg}' does not exist.`);
            process.exit(1);
          } else {
            throw error;
          }
        }

        const stats = await stat(arg);
        const files = stats.isDirectory()
          ? await globby(options?.include ?? "**/*.html", {
              dot: true,
              ignore: [...DEFAULT_EXCLUDE, ...(options?.exclude ?? [])],
              cwd: arg,
              absolute: true,
            })
          : [arg];
        return files;
      }),
    )
  ).flat();
}
