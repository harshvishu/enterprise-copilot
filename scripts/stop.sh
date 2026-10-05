#!/usr/bin/env bash
# Stops the backend and/or frontend started from this project. Usage: stop.sh [backend|frontend|all]
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

TARGET="${1:-all}"
case "$TARGET" in
    backend | frontend | all) ;;
    *) printf 'Usage: %s [backend|frontend|all]\n' "$0" >&2; exit 2 ;;
esac

require_command lsof "lsof is needed to find the processes using the ports." || exit 1

process_cwd() {
    lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'
}

stop_port() {
    local port="$1" service="$2" pids pid cwd owned="" waited=0
    pids="$(port_pids "$port")"
    if [[ -z "$pids" ]]; then
        info "The $service is not running (port $port is free)."
        return 0
    fi

    for pid in $pids; do
        cwd="$(process_cwd "$pid")"
        if [[ "$cwd" == "$REPO_ROOT" || "$cwd" == "$REPO_ROOT/"* ]]; then
            owned="$owned $pid"
        else
            warn "Port $port is used by PID $pid ($(ps -p "$pid" -o comm= 2>/dev/null | xargs basename 2>/dev/null)), which is not from this project. Leaving it running."
            printf '         Started from: %s\n' "${cwd:-unknown}" >&2
            printf '         To stop it anyway: %skill %s%s\n' "$C_BOLD" "$pid" "$C_RESET" >&2
        fi
    done
    [[ -n "$owned" ]] || return 1

    info "Stopping the $service (PID$owned)"
    kill -TERM $owned 2>/dev/null || true
    while (( waited < 10 )) && kill -0 $owned 2>/dev/null; do
        sleep 1
        waited=$((waited + 1))
    done
    for pid in $owned; do
        if kill -0 "$pid" 2>/dev/null; then
            warn "PID $pid did not stop within 10s; forcing it."
            kill -KILL "$pid" 2>/dev/null || true
        fi
    done
    info "The $service has stopped."
}

result=0
[[ "$TARGET" == "frontend" ]] || stop_port "$BACKEND_PORT" "backend" || result=1
[[ "$TARGET" == "backend" ]] || stop_port "$FRONTEND_PORT" "frontend" || result=1
exit "$result"
