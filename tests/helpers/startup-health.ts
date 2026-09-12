import type { StartupHealth } from "../../src/codex/autostart-health";

export function startupHealthFixture(overrides: Partial<StartupHealth> = {}): StartupHealth {
  return {
    status: "native",
    routingKind: "native",
    routingInjected: false,
    localRoutingDependency: false,
    autostartEnabled: false,
    rebootSafe: true,
    protection: "none",
    serviceInstalled: false,
    serviceViable: false,
    serviceEnabled: false,
    serviceRunning: false,
    serviceStale: false,
    serviceConflict: false,
    shimInstalled: false,
    shimHealthy: false,
    shimCoverage: "none",
    serviceSupported: true,
    platform: process.platform,
    diagnosticStale: false,
    recommendedCommand: null,
    commands: {
      installService: "occx service install",
      repairService: "occx service repair",
      installShim: "occx codex-shim install",
      restoreNative: "occx restore",
    },
    ...overrides,
  };
}
