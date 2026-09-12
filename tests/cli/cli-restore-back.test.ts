import { describe, expect, setDefaultTimeout, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { claimOwnedServiceHome, withOwnedServiceHomePreload } from "../helpers/owned-service-home";
import { SPAWN_BUDGET_MS } from "../helpers/test-budget";
import { removeTreeWithRetry } from "../helpers/remove-tree";
import { repoRoot as resolveRepoRoot } from "../helpers/repo-root";

const repoRoot = resolveRepoRoot();

// Every case spawns the real CLI; match cli-provider.test.ts budgets so a wedged
// child fails fast instead of burning the whole shard timeout on Linux CI.
setDefaultTimeout(SPAWN_BUDGET_MS);

function ownedEnvironment(codexHome: string, occxHome: string): Record<string, string> {
  const home = join(occxHome, "home");
  mkdirSync(home, { recursive: true });
  return { HOME: home, USERPROFILE: home, ...claimOwnedServiceHome(codexHome, occxHome, home).env };
}

function runCli(args: string[], env: Record<string, string>) {
  return spawnSync(process.execPath, withOwnedServiceHomePreload(["run", "src/cli/index.ts", ...args]), {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: SPAWN_BUDGET_MS - 5_000,
  });
}

describe("occx restore back", () => {
  test("restore durably disables Codex in an isolated home", () => {
    const codexHome = mkdtempSync(join(tmpdir(), "occx-cli-restore-codex-"));
    const occxHome = mkdtempSync(join(tmpdir(), "occx-cli-restore-home-"));
    try {
      writeFileSync(join(codexHome, "config.toml"), 'model = "gpt-5"\n', "utf8");
      writeFileSync(join(occxHome, "config.json"), JSON.stringify({ providers: {}, defaultProvider: "openai", checkForUpdates: false }), "utf8");
      const result = runCli(["restore"], {
        ...ownedEnvironment(codexHome, occxHome),
        CODEX_HOME: codexHome,
        OPENCCX_HOME: occxHome,
        CI: "1",
      });
      expect(result.status).toBe(0);
      expect(JSON.parse(readFileSync(join(occxHome, "config.json"), "utf8")).clientIntegrations.codex).toBe(false);
      expect(`${result.stdout}\n${result.stderr}`).toContain("Codex integration is OFF and plain `codex` now runs natively.");
      expect(result.stdout).toContain("occx recover-history --occx-compaction <thread-id> --yes");
    } finally {
      removeTreeWithRetry(codexHome);
      removeTreeWithRetry(occxHome);
    }
  });

  test("restore --json emits a schema-complete envelope on the already-OFF no-op path", () => {
    const codexHome = mkdtempSync(join(tmpdir(), "occx-cli-json-noop-codex-"));
    const occxHome = mkdtempSync(join(tmpdir(), "occx-cli-json-noop-home-"));
    try {
      writeFileSync(join(codexHome, "config.toml"), 'model = "gpt-5"\n', "utf8");
      writeFileSync(join(occxHome, "config.json"), JSON.stringify({
        providers: {}, defaultProvider: "openai", checkForUpdates: false,
        clientIntegrations: { codex: false },
      }), "utf8");
      const result = runCli(["restore", "--json"], {
        ...ownedEnvironment(codexHome, occxHome),
        CODEX_HOME: codexHome,
        OPENCCX_HOME: occxHome,
      });
      expect(result.status).toBe(0);
      const envelope = JSON.parse(result.stdout) as {
        success: boolean;
        artifacts: Record<"config" | "catalog" | "history", { state: string; changed: boolean; message: string }>;
      };
      // Early exits must stay shape-stable with CodexNativeRestoreResult:
      // consumers never special-case a valid outcome.
      expect(envelope.success).toBe(true);
      for (const key of ["config", "catalog", "history"] as const) {
        expect(envelope.artifacts[key].state).toBe("skipped");
        expect(envelope.artifacts[key].changed).toBe(false);
        expect(typeof envelope.artifacts[key].message).toBe("string");
      }
      expect(envelope.artifacts.catalog).toHaveProperty("removed", 0);
      expect(envelope.artifacts.history).toHaveProperty("rows", 0);
    } finally {
      removeTreeWithRetry(codexHome);
      removeTreeWithRetry(occxHome);
    }
  });

  test("sync treats durable OFF as a successful no-write policy result", () => {
    const codexHome = mkdtempSync(join(tmpdir(), "occx-cli-sync-off-codex-"));
    const occxHome = mkdtempSync(join(tmpdir(), "occx-cli-sync-off-home-"));
    try {
      const configPath = join(codexHome, "config.toml");
      writeFileSync(configPath, 'model = "gpt-5"\n', "utf8");
      writeFileSync(join(occxHome, "config.json"), JSON.stringify({ providers: {}, defaultProvider: "openai", clientIntegrations: { codex: false }, checkForUpdates: false }), "utf8");
      const before = statSync(configPath).mtimeMs;
      const result = runCli(["sync"], {
        ...ownedEnvironment(codexHome, occxHome),
        CODEX_HOME: codexHome,
        OPENCCX_HOME: occxHome,
        CI: "1",
      });
      expect(result.status).toBe(0);
      // #1931: explicit sync now refreshes the occx-side catalog/cache while OFF when a
      // catalog source exists ("refreshed") and reports "refresh skipped" otherwise
      // (CI has no Codex catalog source). The durable policy invariant is the same in
      // both: Codex config is untouched (mtime asserted below).
      const combined = `${result.stdout}\n${result.stderr}`;
      expect(combined).toMatch(/Codex integration is OFF; catalog (and models cache refreshed|refresh skipped), Codex config untouched\./);
      expect(statSync(configPath).mtimeMs).toBe(before);
    } finally {
      removeTreeWithRetry(codexHome);
      removeTreeWithRetry(occxHome);
    }
  });

  test("sync exits nonzero when managed-default cleanup is ambiguous", () => {
    const codexHome = mkdtempSync(join(tmpdir(), "occx-cli-sync-codex-"));
    const occxHome = mkdtempSync(join(tmpdir(), "occx-cli-sync-home-"));
    try {
      writeFileSync(join(codexHome, "config.toml"), [
        "# Managed by openccx: native subagent defaults table",
        "[agents]",
        "# Managed by openccx: native subagent default",
        "",
        'default_subagent_model = "gpt-5.6-sol"',
        "",
      ].join("\n"), "utf8");
      writeFileSync(join(occxHome, "config.json"), JSON.stringify({
        providers: {
          fixture: {
            adapter: "openai-chat",
            baseUrl: "http://127.0.0.1:1/v1",
            apiKey: "fixture-key",
            allowPrivateNetwork: true,
            models: ["fixture-model"],
          },
        },
        defaultProvider: "fixture",
        checkForUpdates: false,
      }), "utf8");
      const catalogPath = join(codexHome, "openccx-catalog.json");
      const cachePath = join(codexHome, "models_cache.json");
      const catalogBefore = '{"models":[{"slug":"fixture/keep-me"}]}\n';
      const cacheBefore = '{"models":[{"slug":"fixture/cached-keep-me"}],"fetched_at":1}\n';
      writeFileSync(catalogPath, catalogBefore, "utf8");
      writeFileSync(cachePath, cacheBefore, "utf8");

      const result = runCli(["sync"], {
        ...ownedEnvironment(codexHome, occxHome),
        CODEX_HOME: codexHome,
        OPENCCX_HOME: occxHome,
        CI: "1",
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Codex config injection refused");
      expect(result.stderr).toContain("Codex sync did not complete");
      expect(readFileSync(catalogPath, "utf8")).toBe(catalogBefore);
      expect(readFileSync(cachePath, "utf8")).toBe(cacheBefore);
    } finally {
      removeTreeWithRetry(codexHome);
      removeTreeWithRetry(occxHome);
    }
  });

  test("help documents both directions of the switch", () => {
    const codexHome = mkdtempSync(join(tmpdir(), "occx-cli-help-codex-"));
    const occxHome = mkdtempSync(join(tmpdir(), "occx-cli-help-home-"));
    try {
      writeFileSync(join(codexHome, "config.toml"), 'model = "gpt-5"\n', "utf8");
      writeFileSync(join(occxHome, "config.json"), JSON.stringify({
        providers: {}, defaultProvider: "openai", checkForUpdates: false,
      }), "utf8");
      const env = {
        ...ownedEnvironment(codexHome, occxHome),
        CODEX_HOME: codexHome,
        OPENCCX_HOME: occxHome,
        CI: "1",
      };
      const usage = runCli(["help"], env);
      expect(usage.status).toBe(0);
      expect(`${usage.stdout}\n${usage.stderr}`).toContain("occx restore back");
      const restoreHelp = runCli(["help", "restore"], env);
      expect(restoreHelp.status).toBe(0);
      expect(`${restoreHelp.stdout}\n${restoreHelp.stderr}`).toContain("occx restore [back]");
    } finally {
      removeTreeWithRetry(codexHome);
      removeTreeWithRetry(occxHome);
    }
  });
});
