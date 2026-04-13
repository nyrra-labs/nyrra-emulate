set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

build:
  pnpm --filter web-svelte build

dev-docs:
  pnpm --filter web-svelte dev

build-all:
  pnpm build

check:
  pnpm --filter web-svelte type-check
  pnpm --filter web-svelte lint
  pnpm --filter web-svelte test
  pnpm --filter web-svelte build

ambieng:
  ./.ambieng/scripts/ambieng-init.sh

ambieng-reset:
  ./.ambieng/scripts/ambieng-init.sh --reset

ambieng-tail pane="codex":
  if [ "{{pane}}" = "worker" ]; then ./.ambieng/scripts/tail-worker.sh; else ./.ambieng/scripts/tail-codex.sh; fi

[private]
_agent-ambieng-headless:
  ./.ambieng/scripts/ambieng-init.sh --no-open-ghostty

[private]
_agent-ambieng-reset-headless:
  ./.ambieng/scripts/ambieng-init.sh --reset --no-open-ghostty

[private]
_agent-send-orchestrator-bootstrap:
  ./.ambieng/scripts/send-orchestrator-bootstrap.sh

[private]
_agent-send-worker-bootstrap:
  ./.ambieng/scripts/send-worker-bootstrap.sh
