import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findCommand } from "./registry";

const repoRoot = dirname(fileURLToPath(new URL("../../package.json", import.meta.url)));

/**
 * Version of the `occx` bundle this process is running from.
 *
 * Exported so `status`/`doctor` can compare it against the version the live proxy reports,
 * which is how a stale `occx` earlier on PATH becomes visible (#2701). Returns `"unknown"`
 * rather than throwing; callers must treat that as "cannot compare", not as a mismatch.
 */
export function packageVersion(): string {
  const raw = readFileSync(join(repoRoot, "package.json"), "utf8");
  const parsed = JSON.parse(raw) as { version?: unknown };
  return typeof parsed.version === "string" ? parsed.version : "unknown";
}

export function printVersion(): void {
  console.log(`openccx ${packageVersion()}`);
}

export function printUsage(): void {
  console.log(`openccx (occx) — Universal provider proxy for Codex

Usage:
  occx setup                   Interactive setup (alias: init)
  occx start [--port <port>]   Start the proxy server (auto-syncs models to Codex)
  occx stop                    Stop the proxy AND restore native Codex (plain codex works again)
  occx restore                 Restore native Codex without stopping (alias: eject)
  occx restore back            Re-point codex at the running proxy (undo restore)
  occx recover-history --legacy-openai --yes
                               Force all user-message openccx rows to OpenAI (legacy recovery)
  occx recover-history --occx-compaction <thread-id> --yes
                               Back up and make one occx1-compacted thread replayable by native Codex
  occx uninstall               Remove service/shim/config and restore native Codex (alias: remove)
  occx service [sub]           Run as a background service (default: install/update/start)
  occx codex-shim <sub>        Auto-start proxy when \`codex\` launches (install|status|uninstall|remove)
  occx tray <sub>              Windows status tray (install|start|stop|status|uninstall)
  occx ensure                  Ensure the proxy is running and Codex config/cache are current
  occx connect <url>           Connect this machine to a remote Openccx hub (credential via stdin)
  occx disconnect              Restore local state and clear the hub connection
  occx sync [--restart-codex]  Fetch models from providers and inject into Codex config
  occx sync-cache [--restart-codex]
                              Refresh Codex's model cache from the active catalog
  occx status                  Check proxy server status (on a hub: one block with its ports and token source)
  occx doctor                  Diagnose environment/network issues (WSL, proxy, ChatGPT reachability)
  occx doctor --reclaim-response-temps
                              Reclaim abandoned response-state temp files (works without a running proxy)
  occx doctor --recover-zero-byte-coordinator --yes
                              Back up a proven zero-byte Codex coordinator after stopping the proxy
  occx debug <scope>           provider/usage/injection/claude on|off|status|reset
  occx login <provider>        OAuth or API-key provider login (occx login codex for Codex/ChatGPT)
  occx logout <provider>       Remove a stored OAuth login
  occx gui [pair --origin <browser-origin> [--json]]
                              Open the dashboard or create a single-use remote pairing grant
  occx hub invite [--json]     Print a ready-to-run \`occx connect\` line for one more machine
                              (hub only; see \`occx help hub\` for the one-port topology)
  occx update [--tag <tag>]    Update openccx (keeps preview installs on @preview)
  occx restart                  Stop and restart the proxy
  occx v2 <sub>                multi_agent_v2 surface (status|on|off|mode|keep-native-v1|threads|mode-hint)
  occx health [--json]          Check proxy health (exit 0=healthy, 1=not)
  occx capabilities [--json]    List declared capabilities and the API routes they drive
  occx ready [--json] [--wait [--timeout <s>]]  Check post-sync readiness (exit 0 only when ready)
  occx provider <sub>          Providers, connectivity, quota, and selected models
  occx account <sub>           Accounts, login/reauth, key pools, and quota controls
  occx models <sub>            Live/custom models, visibility, context, and shadow calls
  occx alias <sub>             Short names for providers and models (list, set, rm, defaults)
  occx combo <sub>             Combo routing strategies and failover
  occx agent <sub>             Subagents, injection, effort caps, and sidecars
  occx effort [sub]            Inspect and configure reasoning effort caps and defaults
  occx observe <sub>           Logs, usage, storage, memory, and debug data
  occx inspect <sub>           Effective config, catalog, analytics, pacing, client-config
  occx route <sub>             Routing features (combo, policy)
  occx logs [filters]          Alias of occx observe logs
  occx usage [--range <today|1d|7d|30d|all>] [--provider <name>] [--model <id>]
                              Token and estimated-cost report (alias of occx observe usage)
  occx storage <sub>           Storage report, cleanup, trash, and the cleanup policy
  occx memory [--json]         Alias of occx observe memory
  occx api-key <sub>           Alias of occx access key
  occx access <sub>            External API keys and endpoint information
  occx export --client <id>    Print a client config wired to the running proxy (15 clients)
  occx integration client <sub> Enable, disable, inspect or roll back a client integration
  occx grok <sub>              Grok Build model selection and apply
  occx system <sub>            Runtime settings, startup, sync, Openccx updates, and Codex CLI inspection
  occx config <sub>            Validated configuration show/get/set/import/export
  occx lab <sub>               Read-only Compatibility Lab projection inspection
  occx claude [args...]        Launch Claude Code wired to the proxy (model discovery on)
  occx claude desktop [sub]    Manage and apply Claude Desktop's four-family profile
  occx opencode [args...]      Launch opencode wired to the proxy (runtime provider config)
  occx mcode [args...]         Launch MiniMax Code through its managed provider
  occx mmx text <sub> [args]   Launch MiniMax CLI text through the proxy
  occx zcode [sub]             Connect ZCode to the proxy (managed provider)
  occx help [command]          Show help
  occx --version | -v          Print version

Examples:
  occx init                    Set up provider and inject into Codex
  occx start                   Start on default port (10100)
  occx start --port 8080       Start on custom port
  occx help service            Show service command help
  occx help hub                Explain the hub topology, token file, and invites
  occx sync                    Sync available models to Codex`);
}

export function hasHelpFlag(values: string[]): boolean {
  return values.some(value => value === "--help" || value === "-h" || value === "help");
}

export function printSubcommandUsage(name: string | undefined): void {
  const entry = name ? findCommand(name) : undefined;
  if (!entry) {
    console.error(`Unknown command: ${name ?? ""}`.trim());
    printUsage();
    process.exit(1);
  }
  console.log(`Usage: ${entry.usage}\n\n${entry.summary}`);
  if (entry.details?.length) console.log(`\n${entry.details.join("\n")}`);
}
