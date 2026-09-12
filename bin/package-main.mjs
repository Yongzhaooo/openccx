export const packageName = "openccx";
export const cliCommand = "occx";

export async function loadBunApi() {
  if (typeof Bun === "undefined") {
    throw new Error("The openccx programmatic API requires the Bun runtime. Use `occx` for the CLI entrypoint.");
  }
  return import("../src/index.ts");
}
