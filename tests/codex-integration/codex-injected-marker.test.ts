import { describe, expect, test } from "bun:test";
import { providerTableString, rootTomlString } from "../../src/codex/injected-marker";

describe("Codex injected marker TOML strings", () => {
  test("decodes escaped basic strings", () => {
    expect(rootTomlString('model_catalog_json = "C:\\\\Users\\\\occx\\\\catalog.json"', "model_catalog_json"))
      .toBe("C:\\Users\\occx\\catalog.json");
  });

  test("rejects unterminated basic strings with long backslash runs", () => {
    const malformed = `model_provider = "${"\\".repeat(10_000)}`;
    expect(rootTomlString(malformed, "model_provider")).toBeNull();

    const providerConfig = `[model_providers.openccx]\nbase_url = "${"\\".repeat(10_000)}`;
    expect(providerTableString(providerConfig, "openccx", "base_url")).toBeNull();
  });
});
