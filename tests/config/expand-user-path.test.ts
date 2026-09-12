import { afterEach, describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { expandUserPath, getConfigDir } from "../../src/config";

const previousOpenccxHome = process.env.OPENCCX_HOME;

afterEach(() => {
  if (previousOpenccxHome === undefined) delete process.env.OPENCCX_HOME;
  else process.env.OPENCCX_HOME = previousOpenccxHome;
});

describe("expandUserPath", () => {
  test("expands ~ and leading ~/ or ~\\ to the home directory", () => {
    expect(expandUserPath("~")).toBe(homedir());
    expect(expandUserPath("~/custom/dir")).toBe(join(homedir(), "custom/dir"));
    expect(expandUserPath("~\\custom\\dir")).toBe(join(homedir(), "custom\\dir"));
  });

  test("leaves ~user, absolute, relative, and %VAR%/$VAR paths untouched", () => {
    expect(expandUserPath("~other/dir")).toBe("~other/dir");
    expect(expandUserPath("/absolute/dir")).toBe("/absolute/dir");
    expect(expandUserPath("relative/dir")).toBe("relative/dir");
    expect(expandUserPath("%USERPROFILE%\\dir")).toBe("%USERPROFILE%\\dir");
    expect(expandUserPath("$HOME/dir")).toBe("$HOME/dir");
  });
});

describe("OPENCCX_HOME tilde expansion", () => {
  test("getConfigDir honors OPENCCX_HOME=~/...", () => {
    process.env.OPENCCX_HOME = "~/.occx-tilde-test";
    expect(getConfigDir()).toBe(join(homedir(), ".occx-tilde-test"));
  });
});
