#!/usr/bin/env bash
# Restart the local openccx proxy fully detached from the caller's TTY/session, so an agent
# session that launches it does not get killed when the agent turn ends. Waits for the new
# runtime-port.json and prints a health line. Usage: scripts/occx-restart.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${OCCX_RESTART_LOG:-/tmp/occx-restart.log}"
PORT_FILE="$HOME/.opencodex/runtime-port.json"

cd "$REPO_DIR"

echo "[occx-restart] stopping current proxy (if any)..."
bun run src/cli/index.ts stop >/dev/null 2>&1 || true
sleep 2
rm -f "$HOME/.opencodex/occx.pid"

echo "[occx-restart] starting detached proxy (log: $LOG_FILE)..."
# setsid + nohup fully detaches from the controlling terminal and process group where setsid
# is available. macOS does not ship setsid, so fall back to nohup there. </dev/null prevents
# stdin coupling, and disown below removes the job from this shell's lifecycle.
if command -v setsid >/dev/null 2>&1; then
  setsid nohup bun run src/cli/index.ts start >"$LOG_FILE" 2>&1 </dev/null &
else
  nohup bun run src/cli/index.ts start >"$LOG_FILE" 2>&1 </dev/null &
fi
disown || true

for i in $(seq 1 30); do
  if [ -f "$PORT_FILE" ]; then
    PORT="$(node -e "process.stdout.write(String(require('$PORT_FILE').port||''))" 2>/dev/null || echo "")"
    if [ -n "$PORT" ] && curl -sf "http://127.0.0.1:$PORT/v1/models" >/dev/null 2>&1; then
      echo "[occx-restart] healthy on port $PORT (pid $(cat "$HOME/.opencodex/occx.pid" 2>/dev/null))"
      exit 0
    fi
  fi
  sleep 1
done

echo "[occx-restart] WARN: proxy did not report healthy within 30s; tail of log:" >&2
tail -n 15 "$LOG_FILE" >&2 || true
exit 1
