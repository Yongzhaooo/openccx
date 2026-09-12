import CodexSetMultiauth from "./codex-set-multiauth";

/**
 * Codex Set — the page that configures Codex as a whole, not just its accounts.
 *
 * This used to be a two-panel page (Multi-auth / Prompt) behind a hash-backed tab shell
 * with lazy per-panel mounting, because Multi-auth polls /api/codex-auth/* on a 30s timer
 * that had no business running while the user edited prompts. The Prompt panel went with
 * the Codex prompt-layer surface, so there is one panel left to switch between and the
 * shell went with it. The panel wrapper stays: it carries the id the page's tests and
 * styles key off.
 */
export default function CodexSet({ apiBase }: { apiBase: string }) {
  return (
    <div id="codex-set-panel-multiauth">
      <CodexSetMultiauth apiBase={apiBase} />
    </div>
  );
}
