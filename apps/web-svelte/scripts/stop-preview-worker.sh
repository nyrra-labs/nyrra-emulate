#!/usr/bin/env bash
#
# Stop helper for the `preview:worker` package script.
#
# Targets ONLY processes currently listening on TCP 127.0.0.1:8788 (the
# local Cloudflare Workers preview port that `preview:worker` boots
# wrangler dev on). Sends SIGTERM first, waits up to 5 seconds for the
# socket to be released, then escalates to SIGKILL on any remaining
# listener. Does NOT do a broad `pkill workerd`: an unrelated wrangler
# dev session running for a different worker on a different port stays
# untouched.
#
# Exit codes:
#   0 — port 8788 is free (either nothing was listening, or cleanup
#       succeeded)
#   1 — port 8788 still has a listener after SIGKILL (genuinely stuck)
#
# Usage: pnpm --filter web-svelte preview:worker:stop

set -euo pipefail

PORT=8788

list_listeners() {
	lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true
}

PIDS=$(list_listeners)

if [ -z "$PIDS" ]; then
	echo "preview:worker:stop: no listener on tcp:$PORT, nothing to do."
	exit 0
fi

echo "preview:worker:stop: SIGTERM to listener PID(s) on tcp:$PORT: $PIDS"
for PID in $PIDS; do
	kill -TERM "$PID" 2>/dev/null || true
done

for _ in 1 2 3 4 5; do
	if [ -z "$(list_listeners)" ]; then
		echo "preview:worker:stop: tcp:$PORT released."
		exit 0
	fi
	sleep 1
done

REMAINING=$(list_listeners)
if [ -n "$REMAINING" ]; then
	echo "preview:worker:stop: SIGKILL to remaining PID(s) on tcp:$PORT: $REMAINING"
	for PID in $REMAINING; do
		kill -KILL "$PID" 2>/dev/null || true
	done
fi

if [ -n "$(list_listeners)" ]; then
	echo "preview:worker:stop: ERROR: tcp:$PORT still listening after SIGKILL." >&2
	exit 1
fi

echo "preview:worker:stop: tcp:$PORT released."
