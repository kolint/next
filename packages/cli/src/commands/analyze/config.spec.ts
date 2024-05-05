import { importConfig, resolveConfigPath } from "./config.js";
import { describe, it, expect } from "bun:test";

describe("resolveConfigPath", () => {
  it('fails when unable to resolve config if resolution is "force"', async () => {
    await expect(
      resolveConfigPath({
        resolution: "force",
        directory: "test/samples/empty",
      }),
    ).rejects.toThrow();
  });

  it('returns null when unable to resolve config and resolution is "auto"', async () => {
    expect(
      await resolveConfigPath({
        resolution: "auto",
        directory: "test/samples/empty",
      }),
    ).toBe(null);
  });

  it('resolves config when resolution is "auto"', async () => {
    expect(
      await resolveConfigPath({
        resolution: "auto",
        directory: "test/samples/config",
      }),
    ).not.toBe(null);
  });

  it('resolves config with ".cjs" extension', async () => {
    expect(
      await resolveConfigPath({
        resolution: "auto",
        directory: "test/samples/config-cjs",
      }),
    ).toEndWith(".cjs");
  });
});

describe("importConfig", () => {
  it('imports ESM in "module" context', async () => {
    const config = (await importConfig(
      "test/samples/config/kolint.config.js",
    )) as unknown as { ok: true };
    expect(config).toMatchObject({ ok: true });
  });

  it('imports CJS in "module" context with ".cjs" extension', async () => {
    const config = (await importConfig(
      "test/samples/config-cjs/kolint.config.cjs",
    )) as unknown as { ok: true };
    expect(config).toMatchObject({ ok: true });
  });
});
