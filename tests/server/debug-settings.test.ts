import { afterEach, describe, expect, test } from "bun:test";
import {
  clearDebugSettings,
  clearDebugSetting,
  getDebugSettings,
  isDebugEnabled,
  isFramesDebugEnabled,
  isUsageDebugEnabled,
  resetDebugSettingsForTests,
  setDebugSettings,
} from "../../src/lib/debug-settings";

describe("debug settings", () => {
  const prevFrames = process.env.OCCX_DEBUG_FRAMES;
  const prevDebug = process.env.OCCX_DEBUG;
  const prevUsage = process.env.OPENCCX_USAGE_DEBUG;

  afterEach(() => {
    resetDebugSettingsForTests();
    if (prevFrames === undefined) delete process.env.OCCX_DEBUG_FRAMES;
    else process.env.OCCX_DEBUG_FRAMES = prevFrames;
    if (prevDebug === undefined) delete process.env.OCCX_DEBUG;
    else process.env.OCCX_DEBUG = prevDebug;
    if (prevUsage === undefined) delete process.env.OPENCCX_USAGE_DEBUG;
    else process.env.OPENCCX_USAGE_DEBUG = prevUsage;
  });

  test("env defaults are off when unset", () => {
    delete process.env.OCCX_DEBUG;
    delete process.env.OCCX_DEBUG_FRAMES;
    delete process.env.OPENCCX_USAGE_DEBUG;
    expect(isDebugEnabled()).toBe(false);
    expect(isFramesDebugEnabled()).toBe(false);
    expect(isUsageDebugEnabled()).toBe(false);
  });

  test("runtime override enables debug without env", () => {
    delete process.env.OCCX_DEBUG;
    delete process.env.OCCX_DEBUG_FRAMES;
    setDebugSettings({ debug: true });
    expect(isDebugEnabled()).toBe(true);
    expect(getDebugSettings().runtimeOverride.debug).toBe(true);
  });

  test("legacy env vars still enable provider debug", () => {
    delete process.env.OCCX_DEBUG;
    process.env.OCCX_DEBUG_FRAMES = "1";
    expect(isDebugEnabled()).toBe(true);
  });

  test("clear restores env defaults", () => {
    process.env.OCCX_DEBUG = "1";
    setDebugSettings({ debug: false });
    expect(isDebugEnabled()).toBe(false);
    clearDebugSetting("debug");
    expect(isDebugEnabled()).toBe(true);
  });

  test("clearDebugSetting only clears one scope", () => {
    process.env.OCCX_DEBUG = "1";
    process.env.OPENCCX_USAGE_DEBUG = "1";
    setDebugSettings({ debug: false, usage: false });
    clearDebugSetting("debug");
    expect(isDebugEnabled()).toBe(true);
    expect(isUsageDebugEnabled()).toBe(false);
    clearDebugSettings();
  });
});
