import { check } from "./checker.js";
import { Severity } from "@kolint/compiler";
import { describe, it, expect } from "bun:test";

describe("Checker", () => {
  it("Supresses severities turned off in config", async () => {
    const diagnostics = await check(["test/samples/TS2345.html"], {
      severity: {
        TS2345: "off",
      },
    });
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === "TS2345"),
    ).not.toBe(true);
  });

  it("Reports diagnostic with severity as specified in options", async () => {
    const diagnostics = await check(["test/samples/TS2345.html"], {
      severity: {
        TS2345: "warn",
      },
    });
    const diagnostic = diagnostics.find(
      (diagnostic) => diagnostic.code === "TS2345",
    );
    expect(!!diagnostic).toBe(true);
    expect(diagnostic!.severity).toBe(Severity.Warning);
  });
});
