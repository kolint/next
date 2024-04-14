import { BunTestExecutorSchema } from "./schema";
import { Executor } from "@nx/devkit";
import { spawn } from "node:child_process";
import { relative, resolve as resolvePath } from "node:path";

import globby = require("globby");

const executor: Executor<BunTestExecutorSchema> = (options, context) =>
  new Promise((resolve, reject) => {
    const project =
      context.projectsConfigurations!.projects[context.projectName!]!;
    const projectRoot = resolvePath(context.root, project.root);

    const defaultPatterns = [
      "{test,spec}/*{_,.}{test,spec}.{js|jsx|ts|tsx}",
      ...(project.sourceRoot
        ? [
            relative(projectRoot, project.sourceRoot) +
              "/*{_,.}{test,spec}.{js|jsx|ts|tsx}",
          ]
        : []),
    ];

    globby(options.pattern ?? defaultPatterns, {
      cwd: projectRoot,
      dot: true,
    })
      .then((entries) => {
        const cmd = [
          "bun",
          "test",
          ...(options.timeout !== undefined
            ? [`--timeout=${options.timeout}`]
            : []),
          ...(options.updateSnapshots !== undefined
            ? [`--update-snapshots=${options.updateSnapshots}`]
            : []),
          ...(options.rerunEach !== undefined
            ? [`--rerun-each=${options.rerunEach}`]
            : []),
          ...(options.only !== undefined ? [`--only=${options.only}`] : []),
          ...(options.todo !== undefined ? [`--todo=${options.todo}`] : []),
          ...(options.coverage !== undefined
            ? [`--coverage=${options.coverage}`]
            : []),
          ...(options.bail !== undefined ? [`--bail=${options.bail}`] : []),
          ...(options.testNamePattern !== undefined
            ? [`--test-name-pattern=${options.testNamePattern}`]
            : []),
          ...entries,
        ];

        if (context.isVerbose) {
          console.debug(cmd.join(" "));
        }

        const subprocess = spawn(cmd[0]!, cmd.slice(1), {
          cwd: projectRoot,
          stdio: "inherit",
        });

        subprocess.on("exit", (code) => {
          console.log(`Process exited with code ${code}.`);
          resolve({ success: code === 0 });
        });

        subprocess.on("error", (error) => {
          reject(error);
        });
      })
      .catch((error) => {
        reject(error);
      });
  });

export default executor;
