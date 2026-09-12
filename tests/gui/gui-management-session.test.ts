import { afterEach, describe, expect, test } from "bun:test";
import { installApiAuthFetch, resetApiAuthFetchForTests } from "../../gui/src/api";

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalSessionStorage = globalThis.sessionStorage;

afterEach(() => {
  resetApiAuthFetchForTests();
  Object.assign(globalThis, {
    window: originalWindow,
    document: originalDocument,
    sessionStorage: originalSessionStorage,
  });
});

describe("GUI management session bootstrap", () => {
  test("management requests use the injected session while data requests remain untouched", async () => {
    const seen: Array<{ url: string; method: string; headers: Headers }> = [];
    const meta = new Map([
      ["openccx-session-token", "occx_session_browser-secret"],
      ["openccx-session-csrf", "csrf-browser-secret"],
      ["openccx-session-origin", "http://localhost:10100"],
      ["openccx-session-server-origin", "http://localhost:10100"],
    ]);
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      seen.push({
        url: input instanceof Request ? input.url : String(input),
        method: init?.method ?? (input instanceof Request ? input.method : "GET"),
        headers: new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)),
      });
      return Response.json({ ok: true });
    };
    Object.assign(globalThis, {
      document: {
        querySelector(selector: string) {
          const match = selector.match(/^meta\[name="([^"]+)"\]$/);
          const content = match ? meta.get(match[1] ?? "") : undefined;
          return content ? { content, remove() {} } : null;
        },
      },
      sessionStorage: { removeItem() {} },
      window: {
        location: new URL("http://localhost:10100/"),
        fetch: fetchImpl,
        prompt: () => null,
      },
    });

    installApiAuthFetch();
    await window.fetch("/api/config");
    await window.fetch("/api/settings", { method: "PUT", body: "{}" });
    await window.fetch("/v1/models");

    expect(seen[0]?.headers.get("x-openccx-api-key")).toBe("occx_session_browser-secret");
    expect(seen[0]?.headers.get("x-openccx-gui-origin")).toBe("http://localhost:10100");
    expect(seen[0]?.headers.get("x-openccx-csrf-token")).toBeNull();
    expect(seen[1]?.headers.get("x-openccx-api-key")).toBe("occx_session_browser-secret");
    expect(seen[1]?.headers.get("x-openccx-csrf-token")).toBe("csrf-browser-secret");
    expect(seen[2]?.headers.get("x-openccx-api-key")).toBeNull();
    expect(seen[2]?.headers.get("x-openccx-gui-origin")).toBeNull();
  });
});
