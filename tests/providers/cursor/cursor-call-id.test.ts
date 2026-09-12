import { beforeEach, describe, expect, test } from "bun:test";
import {
  decodeCursorCallId,
  encodeCursorCallId,
  resetCursorCallIdProvenanceForTests,
} from "../../../src/adapters/cursor/call-id";
import { mapCursorServerMessage } from "../../../src/adapters/cursor/message-mapper";
import type { CursorMessageMapperState } from "../../../src/adapters/cursor/message-mapper";
import type { CursorKvStore } from "../../../src/adapters/cursor/kv-store";

const COMPOSITE = "call-9aee6d07-edc0-442f-8466-9d3924e16e03-0\nfc_5a1a53c6-32ce-9602-bc56-459030165589_0";

function mapperState(): CursorMessageMapperState {
  const kv: CursorKvStore = { get: () => undefined, set: () => {} };
  return { kv, writeClient: () => {} };
}

beforeEach(() => {
  resetCursorCallIdProvenanceForTests();
});

describe("cursor call-id codec", () => {
  test("plain ids pass through unchanged", () => {
    expect(encodeCursorCallId("call_abc123")).toBe("call_abc123");
    expect(decodeCursorCallId("call_abc123")).toBe("call_abc123");
  });

  test("reserved-prefix ids are escaped and round-trip", () => {
    for (const id of ["occxc1_", "occxc1_Y2FsbF8x", "occxc1_!!not-base64url!!", "occxc1_raw\nwire"]) {
      const encoded = encodeCursorCallId(id);
      expect(encoded).not.toBe(id);
      // Newline-bearing ids take the encoding namespace; newline-free reserved ids take the
      // escape namespace. Both are single-line and both reverse exactly.
      expect(encoded.startsWith(id.includes("\n") ? "occxc1_" : "occxc1e_")).toBe(true);
      expect(encoded).not.toContain("\n");
      expect(encoded).not.toContain("\r");
      expect(decodeCursorCallId(encoded)).toBe(id);
    }
  });

  test("opaque ids whose payloads look like reserved namespaces are preserved without provenance", () => {
    for (const id of ["occxc1_b2N4YzFf", "occxc1e_b2N4YzFf", "occxc1e_b2N4YzFlXw"]) {
      expect(decodeCursorCallId(id)).toBe(id);
    }
    // And it still survives a full round trip, via the escape namespace.
    const encoded = encodeCursorCallId("occxc1_b2N4YzFf");
    expect(encoded.startsWith("occxc1e_")).toBe(true);
    expect(decodeCursorCallId(encoded)).toBe("occxc1_b2N4YzFf");
  });

  test("ids already in the escape namespace are themselves escaped", () => {
    const id = "occxc1e_YQpi";
    const encoded = encodeCursorCallId(id);
    expect(encoded).not.toBe(id);
    expect(decodeCursorCallId(encoded)).toBe(id);
    // Untouched when it is not our output: the payload decodes to newline-free non-reserved text.
    expect(decodeCursorCallId("occxc1e_Y2FsbF8x")).toBe("occxc1e_Y2FsbF8x");
  });

  test("reserved-prefix ids resembling legacy newline encodings stay opaque", () => {
    const id = "occxc1_YQpi";
    const encoded = encodeCursorCallId(id);
    expect(encoded).not.toBe(id);
    expect(decodeCursorCallId(encoded)).toBe(id);
    expect(decodeCursorCallId("occxc1_Y2FsbF8x")).toBe("occxc1_Y2FsbF8x");
  });

  test("adversarial reserved-prefix ids escape one layer at a time", () => {
    const cases = [
      "occxc1_Y2FsbF8x",
      "occxc1_Y2FsbF8xCg",
      "occxc1e_b2N4YzFfWTJGc2JGOHhDZw",
    ] as const;

    for (const id of cases) {
      const encoded = encodeCursorCallId(id);
      expect(encoded.startsWith("occxc1e_")).toBe(true);
      expect(decodeCursorCallId(encoded)).toBe(id);
    }
  });

  test("unsigned pre-restart encodings stay opaque", () => {
    for (const id of ["occxc1_YQpi", "occxc1_DQ", "occxc1_DQo", "occxc1_Y2FsbF8xCg"]) {
      expect(decodeCursorCallId(id)).toBe(id);
    }
  });

  test("a process restart invalidates provenance instead of guessing from the payload", () => {
    const encoded = encodeCursorCallId("occxc1e_");
    expect(decodeCursorCallId(encoded)).toBe("occxc1e_");

    resetCursorCallIdProvenanceForTests();
    expect(decodeCursorCallId(encoded)).toBe(encoded);
  });

  test("newline composite id round-trips through a single-line form", () => {
    const encoded = encodeCursorCallId(COMPOSITE);
    expect(encoded).not.toContain("\n");
    expect(encoded).not.toContain("\r");
    expect(encoded.startsWith("occxc1_")).toBe(true);
    expect(decodeCursorCallId(encoded)).toBe(COMPOSITE);
  });

  test("legacy raw newline id decodes to itself (backward compat)", () => {
    expect(decodeCursorCallId(COMPOSITE)).toBe(COMPOSITE);
  });

  test("malformed encoded payloads are not corrupted", () => {
    expect(decodeCursorCallId("occxc1_")).toBe("occxc1_");
    expect(decodeCursorCallId("occxc1_!!not-base64url!!")).toBe("occxc1_!!not-base64url!!");
  });

  test("tool_call_start ids are reversible and single-line at the adapter boundary", () => {
    for (const id of [COMPOSITE, "occxc1_YQpi"]) {
      const events = mapCursorServerMessage(
        { type: "tool_call_start", id, name: "get_weather" },
        mapperState(),
      );
      expect(events).toHaveLength(1);
      const event = events[0]!;
      if (event.type !== "tool_call_start") throw new Error("expected tool_call_start");
      expect(event.id).not.toContain("\n");
      expect(event.id).not.toContain("\r");
      expect(decodeCursorCallId(event.id)).toBe(id);
    }
  });
});
