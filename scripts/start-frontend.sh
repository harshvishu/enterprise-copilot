#!/usr/bin/env bash
# Starts the Vite frontend on port 5173, installing dependencies on first run.
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

require_command node "Install Node.js 22.12 or newer from https://nodejs.org." || exit 1
require_command npm "npm ships with Node.js; reinstall Node.js 22.12 or newer." || exit 1
check_port "$FRONTEND_PORT" "frontend" || exit 1

cd "$FRONTEND_DIR"
if [[ ! -d node_modules ]]; then
    info "Installing frontend dependencies (npm ci)"
    npm ci
fi

info "Starting frontend on http://localhost:$FRONTEND_PORT"
exec npm run dev -- --strictPort "$@"
