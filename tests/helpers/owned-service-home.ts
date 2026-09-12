import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";

export interface OwnedServiceHome {
  /** Add this only to child-process environments that also receive `preloadPath`. */
  readonly env: Record<string, string>;
  /** Explicit Bun preload path; passed as argv so spaces are not shell-parsed. */
  readonly preloadPath?: string;
}

const WINDOWS_SERVICE_PROBE_PRELOAD = resolve(import.meta.dir, "owned-service-home-preload.ts");
const WINDOWS_SERVICE_PROBE_FLAG = "OCCX_TEST_SERVICE_HOME_PROBE";

/**
 * Insert a test preload into a Bun command without relying on BUN_OPTIONS.
 *
 * `bun run` consumes its flags after the `run` subcommand; direct `bun
 * --eval`/file invocations consume them before the entrypoint. Keeping the
 * path as a separate argv element is what makes a checkout directory with
 * spaces safe on Bun 1.4 and on Windows child_process/Bun.spawn alike.
 */
export function withOwnedServiceHomePreload(
  args: readonly string[],
  preloadPath = WINDOWS_SERVICE_PROBE_PRELOAD,
): string[] {
  if (process.platform !== "win32") return [...args];
  const preloadArgs = ["--preload", preloadPath];
  if (args[0] === "run" || args[0] === "test") {
    return [args[0], ...preloadArgs, ...args.slice(1)];
  }
  return [...preloadArgs, ...args];
}

function windowsServiceProbeEnv(): Record<string, string> {
  // The production Windows probe deliberately resolves schtasks.exe/sc.exe from
  // System32, so PATH fixtures cannot isolate it. The flag is inert unless the
  // caller also passes `preloadPath` through withOwnedServiceHomePreload; this
  // keeps it out of the parent test environment and unrelated nested children.
  return {
    [WINDOWS_SERVICE_PROBE_FLAG]: "1",
  };
}

/**
 * Seed the same state and service-manager definition that an installed proxy
 * records, scoped entirely to a test home.
 *
 * Linux CI has no user systemd bus. The production probe correctly treats that
 * as unproven ownership, so the fixture supplies a read-only `systemctl show`
 * response on its own PATH together with the unit that response describes.
 */
export function claimOwnedServiceHome(
  codexHome: string,
  openccxHome: string,
  home: string,
): OwnedServiceHome {
  writeFileSync(join(openccxHome, "service-state.json"), JSON.stringify({
    version: 2,
    codexHome,
    openccxHome,
    backend: "scheduler",
  }));

  if (process.platform === "darwin") {
    const launchAgents = join(home, "Library", "LaunchAgents");
    mkdirSync(launchAgents, { recursive: true, mode: 0o700 });
    writeFileSync(join(launchAgents, "com.openccx.proxy.plist"), [
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
      "<plist version=\"1.0\"><dict><key>EnvironmentVariables</key><dict>",
      `<key>CODEX_HOME</key><string>${codexHome}</string>`,
      `<key>OPENCCX_HOME</key><string>${openccxHome}</string>`,
      "</dict></dict></plist>",
    ].join("\n"));
  }

  if (process.platform === "win32") {
    return { env: windowsServiceProbeEnv(), preloadPath: WINDOWS_SERVICE_PROBE_PRELOAD };
  }
  if (process.platform !== "linux") return { env: {} };

  const unitDir = join(home, ".config", "systemd", "user");
  mkdirSync(unitDir, { recursive: true, mode: 0o700 });
  writeFileSync(join(unitDir, "openccx-proxy.service"), [
    "[Service]",
    `Environment=\"CODEX_HOME=${codexHome}\"`,
    `Environment=\"OPENCCX_HOME=${openccxHome}\"`,
  ].join("\n"));

  const binDir = join(home, ".occx-test-bin");
  mkdirSync(binDir, { recursive: true, mode: 0o700 });
  const systemctl = join(binDir, "systemctl");
  writeFileSync(systemctl, [
    "#!/bin/sh",
    "if [ \"$1\" != \"--user\" ] || [ \"$2\" != \"show\" ] || [ \"$3\" != \"openccx-proxy\" ]; then exit 64; fi",
    "printf '%s\\n' 'LoadState=loaded' 'ActiveState=inactive' 'FragmentPath=fixture' 'NeedDaemonReload=no'",
  ].join("\n"));
  chmodSync(systemctl, 0o700);

  return { env: { PATH: [binDir, process.env.PATH ?? ""].filter(Boolean).join(delimiter) } };
}
