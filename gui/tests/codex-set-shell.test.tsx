/**
 * Codex Set page — Multi-auth.
 *
 * This file used to cover a two-panel tab shell (Multi-auth / Prompt) plus the Prompt
 * panel's config-toggle rows. The Prompt panel went with the Codex prompt-layer surface,
 * so what is left to pin here is that the page renders Multi-auth and that the legacy
 * `#codex-auth` bookmark still resolves to it.
 */
import { afterEach, beforeEach, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { act } from "react";
import type { Root } from "react-dom/client";
import { LanguageProvider } from "../src/i18n/provider";
import { clearClientResourceStoresForTests } from "../src/client-resource";
import CodexSet from "../src/pages/CodexSet";
import { readPageFromHash, resolveAppHashChange, hashBelongsToPage } from "../src/app-routing";

const globals = ["document", "window", "navigator", "localStorage", "IS_REACT_ACT_ENVIRONMENT"] as const;
let previousGlobals: Record<(typeof globals)[number], unknown>;
let testWindow: Window;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  previousGlobals = Object.fromEntries(globals.map(key => [key, Reflect.get(globalThis, key)])) as typeof previousGlobals;
  testWindow = new Window({ url: "http://localhost/#codex-set" });
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: testWindow.document },
    window: { configurable: true, value: testWindow },
    navigator: { configurable: true, value: testWindow.navigator },
    localStorage: { configurable: true, value: testWindow.localStorage },
  });
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  // The resource store is keyed by apiBase and outlives a single test. Without
  // this, a later case renders the PREVIOUS case's snapshot from cache and its
  // fetch stub is never consulted.
  clearClientResourceStoresForTests();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  testWindow.close();
  for (const key of globals) {
    Object.defineProperty(globalThis, key, { configurable: true, value: previousGlobals[key] });
  }
});

interface StubCall { url: string; method: string; body: unknown }

function stubRoutes(handler: (call: StubCall) => Response | Promise<Response>) {
  const calls: StubCall[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: StubCall = {
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    return handler(call);
  }) as typeof fetch;
  return calls;
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

async function mountShell(): Promise<{ root: Root; container: HTMLElement }> {
  const { createRoot } = await import("react-dom/client");
  const container = document.createElement("div");
  document.body.append(container);
  let root!: Root;
  await act(async () => {
    root = createRoot(container);
    root.render(<LanguageProvider><CodexSet apiBase="" /></LanguageProvider>);
  });
  return { root, container };
}

function panel(container: HTMLElement): HTMLElement | null {
  return container.querySelector("#codex-set-panel-multiauth");
}

test("1. #codex-set renders Multi-auth", async () => {
  stubRoutes(() => json({}));
  const { container, root } = await mountShell();
  const multi = panel(container);
  expect(multi).not.toBeNull();
  expect(multi!.hasAttribute("hidden")).toBe(false);
  await act(async () => { root.unmount(); });
});

test("3. the shipped #codex-auth bookmark redirects to #codex-set", () => {
  expect(readPageFromHash("codex-auth")).toBe("codex-set");
  const action = resolveAppHashChange("codex-auth");
  expect(action.page).toBe("codex-set");
  expect(action.replaceTo).toBe("codex-set");
  // A nested legacy bookmark resolves too, rather than landing on an unknown page.
  expect(resolveAppHashChange("codex-auth/anything").page).toBe("codex-set");
  // The removed Prompt tab's hash is no longer claimed by this page.
  expect(hashBelongsToPage("codex-set/prompt", "codex-set")).toBe(false);
});
