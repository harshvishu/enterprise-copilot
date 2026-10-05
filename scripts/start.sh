#!/usr/bin/env bash
# Starts the backend, waits until it is listening, then starts the frontend.
# Ctrl+C stops both.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

BACKEND_START_TIMEOUT="${BACKEND_START_TIMEOUT:-300}"
BACKEND_PID=""

# Check everything up front so nothing starts if one of the ports is taken.
problems=0
require_command java "Install Java 21 (JDK) and make sure 'java' is on your PATH." || problems=1
require_command node "Install Node.js 22.12 or newer from https://nodejs.org." || problems=1
require_command npm "npm ships with Node.js; reinstall Node.js 22.12 or newer." || problems=1
check_port "$BACKEND_PORT" "backend" || problems=1
check_port "$FRONTEND_PORT" "frontend" || problems=1
if [[ "$problems" -ne 0 ]]; then
    error "Nothing was started. Fix the issues above and run $0 again."
    exit 1
fi

kill_tree() {
    local pid="$1" child
    for child in $(pgrep -P "$pid" 2>/dev/null); do
        kill_tree "$child"
    done
    kill -TERM "$pid" 2>/dev/null || true
}

cleanup() {
    trap - EXIT INT TERM
    if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        info "Stopping backend"
        kill_tree "$BACKEND_PID"
        wait "$BACKEND_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

"$SCRIPT_DIR/start-backend.sh" > >(awk '{ print "[backend] " $0; fflush() }') 2>&1 &
BACKEND_PID=$!

info "Waiting for the backend on port $BACKEND_PORT (first run downloads dependencies and can take a few minutes)"
elapsed=0
until port_in_use "$BACKEND_PORT"; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        error "The backend stopped before it was ready. Check the [backend] output above."
        exit 1
    fi
    if (( elapsed >= BACKEND_START_TIMEOUT )); then
        error "The backend did not start within ${BACKEND_START_TIMEOUT}s."
        printf '       Check the [backend] output above, or wait longer with: %sBACKEND_START_TIMEOUT=600 %s%s\n' "$C_BOLD" "$0" "$C_RESET" >&2
        exit 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done
info "Backend is up on http://localhost:$BACKEND_PORT"

"$SCRIPT_DIR/start-frontend.sh" 2>&1 | awk '{ print "[frontend] " $0; fflush() }'
