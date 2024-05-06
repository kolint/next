import { globby } from "globby";
import { access, stat } from "node:fs/promises";

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
              ignore: Array.isArray(options?.exclude)
                ? options.exclude.slice()
                : options?.exclude
                  ? [options.exclude]
                  : undefined,
              cwd: arg,
              absolute: true,
            })
          : [arg];
        return files;
      }),
    )
  ).flat();
}
