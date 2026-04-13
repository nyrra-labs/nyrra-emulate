#!/usr/bin/env bash
#
# Stop helper for the `preview:worker` package script.
#
# Tears down the entire local-preview process tree rooted at TCP
# 127.0.0.1:8788, including the inner workerd runtime children that
# wrangler dev spawns on ephemeral ports (`socket-addr=entry=127.0.0.1:0`)
# alongside the public listener on `socket-addr=entry=127.0.0.1:8788`,
# AND any repo-local workerd that became orphaned earlier in the same
# preview chain (e.g. workerds spawned during the `vite build` phase
# whose parent process exited before wrangler dev took over). Four
# narrowly-scoped discovery mechanisms run together:
#
#   1. `lsof -tiTCP:8788 -sTCP:LISTEN` — finds the active workerd
#      bound to the preview port.
#
#   2. `pgrep -f -- "$PREVIEW_SIGNATURE"` — finds every process whose
#      command line contains the literal flag combination
#      `--port 8788 --show-interactive-dev-session=false` that the
#      `preview:worker` script uses. This catches the wrangler dev
#      Node.js process, its forked CLI sub-process, and the `sh -c`
#      wrapper that pnpm script execution leaves around. It does NOT
#      match unrelated wrangler dev sessions on other ports (they
#      lack `--port 8788`).
#
#   3. `pgrep -P` descendant walk — for every PID found by mechanisms
#      1, 2, and 4, recursively collect direct children, grandchildren,
#      etc. The walk relies on the OS-enforced parent-child
#      relationship, so it cannot accidentally walk into unrelated
#      process trees in other repos or other terminal sessions. This
#      catches the live workerd children whose parent (wrangler dev)
#      is still alive.
#
#   4. `pgrep -f -- "$WORKERD_PATH_REGEX"` — finds workerd processes
#      whose binary path lives in THIS workspace's pnpm store
#      (`<workspace>/node_modules/.pnpm/@cloudflare+workerd-...`).
#      The workspace root is derived from the script's own location
#      via `BASH_SOURCE`, so the filter is repo-scoped: workerds
#      installed in OTHER repos under different `node_modules/.pnpm/`
#      paths do not match, and Homebrew/system workerd installs do
#      not match either. The literal `+` in the path is rewritten to
#      the `[+]` character class because `pgrep -f` uses extended
#      regex on macOS, where a bare `+` is a quantifier rather than
#      a literal. This is the only discovery mechanism that reaches
#      a workerd whose ancestor chain has already collapsed (e.g.,
#      the `vite build`-time workerd that gets orphaned when the
#      build phase exits before wrangler dev starts).
#
# All four lists are merged and de-duplicated. SIGTERM is sent to
# the union, then the script polls up to 5 seconds for everything to
# exit. Anything still alive gets SIGKILL. The final check verifies
# both the port and the discoverable processes are gone before
# exiting 0; if anything is still alive after SIGKILL, the script
# exits 1 with a clear error.
#
# Critically, the script does NOT run a broad `pkill workerd` or
# `pkill wrangler`: every kill target is reachable from one of the
# four scoped filters above. An unrelated wrangler dev session
# running for a different worker on a different port stays untouched
# (different `--port` value), and a workerd installed in a different
# repo stays untouched (different binary path).
#
# Exit codes:
#   0 — port 8788 is free and the discoverable preview tree is gone
#   1 — preview process tree for tcp:8788 still alive after SIGKILL
#
# Usage: pnpm --filter web-svelte preview:worker:stop

set -euo pipefail

PORT=8788
PREVIEW_SIGNATURE="--port $PORT --show-interactive-dev-session=false"

# Derive the workspace root from this script's own location so the
# repo-local workerd filter is portable across machines and pnpm
# layouts. scripts/ lives under apps/web-svelte/, so the workspace
# root is three levels up.
SCRIPT_PATH="${BASH_SOURCE[0]:-$0}"
SCRIPT_DIR=$(cd "$(dirname "$SCRIPT_PATH")" && pwd)
WORKSPACE_ROOT=$(cd "$SCRIPT_DIR/../../.." && pwd)
WORKERD_PATH_PREFIX="$WORKSPACE_ROOT/node_modules/.pnpm/@cloudflare+workerd"
# pgrep -f uses extended regex on macOS, so `+` is a quantifier. Replace
# every literal `+` in the prefix with the `[+]` character class so the
# pattern matches the literal `+` in `@cloudflare+workerd-darwin-arm64...`
# instead of being interpreted as "one or more of the previous atom".
WORKERD_PATH_REGEX="${WORKERD_PATH_PREFIX//+/[+]}"

list_listeners() {
	lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true
}

list_signature_pids() {
	pgrep -f -- "$PREVIEW_SIGNATURE" 2>/dev/null || true
}

list_repo_local_workerds() {
	pgrep -f -- "$WORKERD_PATH_REGEX" 2>/dev/null || true
}

# Recursively collect descendant PIDs of $1. Outputs one PID per line.
walk_descendants() {
	local parent=$1
	local children
	children=$(pgrep -P "$parent" 2>/dev/null || true)
	local child
	for child in $children; do
		echo "$child"
		walk_descendants "$child"
	done
}

collect_pids() {
	{
		list_listeners
		list_signature_pids
		list_repo_local_workerds
		local seed
		for seed in $(list_listeners; list_signature_pids; list_repo_local_workerds); do
			walk_descendants "$seed"
		done
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
