#!/usr/bin/env bash
#
# Stop helper for the `preview:worker` package script.
#
# Targets the entire local-preview process tree rooted at TCP
# 127.0.0.1:8788, not just the workerd listener PID. Two narrowly-
# scoped discovery mechanisms run together:
#
#   1. `lsof -tiTCP:8788 -sTCP:LISTEN` — finds the active workerd
#      bound to the preview port. This catches the listener even if
#      its command-line arguments change between wrangler versions.
#
#   2. `pgrep -f -- "$PREVIEW_SIGNATURE"` — finds every process whose
#      command line contains the literal flag combination
#      `--port 8788 --show-interactive-dev-session=false` that the
#      `preview:worker` script uses. This catches the wrangler dev
#      Node.js process, its forked CLI sub-process, and the `sh -c`
#      wrapper that pnpm script execution leaves around. It does NOT
#      match unrelated wrangler dev sessions on other ports (they
#      lack `--port 8788`) and does NOT match orphan workerd processes
#      from prior runs (their command lines use
#      `socket-addr=entry=...` instead of the preview signature).
#
# The two PID lists are merged and de-duplicated. SIGTERM is sent
# first, then the script polls up to 5 seconds for everything to
# exit. Anything still alive gets SIGKILL. The final check verifies
# both the port and the signature-matching processes are gone before
# exiting 0; if anything is still alive after SIGKILL, the script
# exits 1 with a clear error.
#
# Critically, the script does NOT run a broad `pkill workerd` or
# `pkill wrangler`: every kill target is filtered through one of the
# two scoped mechanisms above, so an unrelated wrangler dev session
# running for a different worker on a different port stays untouched.
#
# Exit codes:
#   0 — port 8788 is free and no preview-signature processes remain
#   1 — preview process tree for tcp:8788 still alive after SIGKILL
#
# Usage: pnpm --filter web-svelte preview:worker:stop

set -euo pipefail

PORT=8788
PREVIEW_SIGNATURE="--port $PORT --show-interactive-dev-session=false"

list_listeners() {
	lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true
}

list_signature_pids() {
	pgrep -f -- "$PREVIEW_SIGNATURE" 2>/dev/null || true
}

collect_pids() {
	{
		list_listeners
		list_signature_pids
	} | awk 'NF' | sort -un
}

INITIAL_PIDS=$(collect_pids)

if [ -z "$INITIAL_PIDS" ]; then
	echo "preview:worker:stop: no preview process tree for tcp:$PORT, nothing to do."
	exit 0
fi

echo "preview:worker:stop: SIGTERM to preview process(es) for tcp:$PORT:"
for KILL_PID in $INITIAL_PIDS; do
	ps -p "$KILL_PID" -o pid=,command= 2>/dev/null | sed 's/^/  /' || echo "  $KILL_PID (already exited)"
done
for KILL_PID in $INITIAL_PIDS; do
	kill -TERM "$KILL_PID" 2>/dev/null || true
done

for _ in 1 2 3 4 5; do
	REMAINING=$(collect_pids)
	if [ -z "$REMAINING" ]; then
		echo "preview:worker:stop: tcp:$PORT released and preview process tree exited."
		exit 0
	fi
	sleep 1
done

REMAINING=$(collect_pids)
if [ -n "$REMAINING" ]; then
	echo "preview:worker:stop: SIGKILL to remaining preview process(es): $REMAINING"
	for KILL_PID in $REMAINING; do
		kill -KILL "$KILL_PID" 2>/dev/null || true
	done
fi

if [ -n "$(collect_pids)" ]; then
	echo "preview:worker:stop: ERROR: preview process tree for tcp:$PORT still alive after SIGKILL." >&2
	exit 1
fi

echo "preview:worker:stop: tcp:$PORT released and preview process tree exited."
