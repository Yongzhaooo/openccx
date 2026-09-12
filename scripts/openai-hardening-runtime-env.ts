export function buildSanitizedRuntimeEnv(
  source: Record<string, string | undefined>,
  openccxHome: string,
  codexHome: string,
): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    if (/^(?:OPENAI_|CODEX_|OPENCCX_)/i.test(key)) continue;
    if (/^(?:http|https|all)_proxy$/i.test(key)) continue;
    env[key] = value;
  }
  return {
    ...env,
    OPENCCX_HOME: openccxHome,
    CODEX_HOME: codexHome,
    OCCX_SHIM_BYPASS: "1",
    OPENCCX_API_AUTH_TOKEN: "fixture-admission",
    NO_PROXY: "127.0.0.1,localhost,::1",
    no_proxy: "127.0.0.1,localhost,::1",
  };
}
