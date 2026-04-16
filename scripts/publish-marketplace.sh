#!/usr/bin/env bash
set -euo pipefail

set -a
if [[ -f ./.env ]]; then
	. ./.env
fi
set +a

if [[ -z "${VSCE_PAT:-}" ]]; then
	echo "VSCE_PAT is not set. Expected it in .env or the shell environment." >&2
	exit 1
fi

npx @vscode/vsce publish -p "$VSCE_PAT"
