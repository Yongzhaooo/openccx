import { afterEach, beforeEach, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { Database } from "bun:sqlite";

import { beginCodexTransition } from "../../src/codex/transition-state";
import {
  resolveCodexCoordinatorDatabasePath,
  resolveEffectiveUserIdentity,
} from "../../src/codex/user-identity";
import { removeTreeWithRetry } from "../helpers/remove-tree";

let codexHome = "";
let openccxHome = "";
let coordinatorPath = "";
let previousCodexHome: string | undefined;
let previousOpenccxHome: string | undefined;

beforeEach(() => {
  previousCodexHome = process.env.CODEX_HOME;
  previousOpenccxHome = process.env.OPENCCX_HOME;
  codexHome = mkdtempSync(join(tmpdir(), "occx-transition-first-use-codex-"));
  openccxHome = mkdtempSync(join(tmpdir(), "occx-transition-first-use-occx-"));
  process.env.CODEX_HOME = codexHome;
  process.env.OPENCCX_HOME = openccxHome;
  coordinatorPath = resolveCodexCoordinatorDatabasePath(
    resolveEffectiveUserIdentity(),
    realpathSync.native(codexHome),
  );
});

afterEach(() => {
  if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
  else process.env.CODEX_HOME = previousCodexHome;
  if (previousOpenccxHome === undefined) delete process.env.OPENCCX_HOME;
  else process.env.OPENCCX_HOME = previousOpenccxHome;
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    rmSync(`${coordinatorPath}${suffix}`, { force: true });
  }
  removeTreeWithRetry(codexHome);
  removeTreeWithRetry(openccxHome);
});

function next(txId: string) {
  return {
    txId,
    direction: "apply" as const,
    authoritySnapshotId: `authority-${txId}`,
    nextRetryAt: "2026-08-04T12:00:00.000Z",
  };
}

test("a zero-byte coordinator exposed by a racing SQLite opener is still first use", () => {
  // sqlite3_open_v2(..., SQLITE_OPEN_CREATE) exposes exactly this state before
  // the creating process reaches its first schema write.
  writeFileSync(coordinatorPath, "");
  if (process.platform !== "win32") chmodSync(coordinatorPath, 0o600);

  expect(beginCodexTransition(
    { nativeGeneration: 0, currentTxId: null },
    next("tx-zero-byte"),
  )).toMatchObject({
    kind: "updated",
    state: { nativeGeneration: 1, currentTxId: "tx-zero-byte" },
  });
});

test("a non-empty unversioned coordinator is still refused", () => {
  const database = new Database(coordinatorPath, { create: true });
  database.exec("CREATE TABLE foreign_state (id INTEGER PRIMARY KEY)");
  database.close();
  if (process.platform !== "win32") chmodSync(coordinatorPath, 0o600);

  expect(beginCodexTransition(
    { nativeGeneration: 0, currentTxId: null },
    next("tx-must-not-adopt"),
  )).toEqual({ kind: "unavailable", reason: "database" });
});
