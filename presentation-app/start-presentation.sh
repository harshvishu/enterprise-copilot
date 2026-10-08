#!/usr/bin/env bash
# Starts the standalone presenter app on port 5174.
set -euo pipefail

PRESENTATION_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

for required_command in node npm; do
    if ! command -v "$required_command" >/dev/null 2>&1; then
        printf 'Error: %s is required. Install Node.js 22.12 or newer with npm.\n' "$required_command" >&2
        exit 1
    fi
done

cd "$PRESENTATION_DIR"
if [[ ! -d node_modules ]]; then
    printf 'Installing presentation dependencies (npm ci)\n'
    npm ci
fi

printf 'Starting presentation on http://localhost:5174\n'
# Vite fails if the port is occupied rather than selecting another port.
exec npm run dev -- "$@" --port 5174 --strictPort
