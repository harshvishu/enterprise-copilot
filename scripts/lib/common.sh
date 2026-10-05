# Shared helpers for the start scripts. Source this file; do not run it directly.

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
BACKEND_PORT=8080
FRONTEND_PORT=5173

if [[ -t 1 ]]; then
    C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_BOLD=$'\033[1m'; C_RESET=$'\033[0m'
else
    C_RED=''; C_GREEN=''; C_YELLOW=''; C_BOLD=''; C_RESET=''
fi

info() { printf '%s==>%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '%sWarning:%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
error() { printf '%sError:%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; }

require_command() {
    local cmd="$1" hint="$2"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        error "'$cmd' was not found on your PATH."
        printf '       %s\n' "$hint" >&2
        return 1
    fi
}

# Prints the PIDs listening on a TCP port, one per line (empty if none or lsof is unavailable).
port_pids() {
    command -v lsof >/dev/null 2>&1 || return 0
    lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | sort -u
}

port_in_use() {
    local port="$1"
    if command -v lsof >/dev/null 2>&1; then
        [[ -n "$(port_pids "$port")" ]]
    else
        (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null
    fi
}

# Returns 0 if the port is free; otherwise explains who holds it and how to free it.
check_port() {
    local port="$1" service="$2" pids pid name names=""
    port_in_use "$port" || return 0

    pids="$(port_pids "$port")"
    error "Port ${C_BOLD}$port${C_RESET} is already in use, so the $service cannot start."
    if [[ -n "$pids" ]]; then
        printf '       It is held by:\n' >&2
        for pid in $pids; do
            name="$(ps -p "$pid" -o comm= 2>/dev/null | xargs basename 2>/dev/null)"
            names="$names $name"
            printf '         PID %-8s %s\n' "$pid" "${name:-unknown}" >&2
            printf '                      %s\n' "$(ps -p "$pid" -o args= 2>/dev/null | cut -c1-100)" >&2
        done
    fi

    printf '\n       What you can do:\n' >&2
    case "$names" in
        *docker* | *com.docker* | *vpnkit*)
            printf '         - Docker is using this port. Stop the containers with: %sdocker compose down%s\n' "$C_BOLD" "$C_RESET" >&2
            ;;
        *java*)
            [[ "$port" == "$BACKEND_PORT" ]] && printf '         - A Java process (maybe this backend) is running. Use it, or stop it with Ctrl+C in its terminal.\n' >&2
            ;;
        *node*)
            [[ "$port" == "$FRONTEND_PORT" ]] && printf '         - A Node dev server (maybe this frontend or another project) is running. Use it, or stop it with Ctrl+C in its terminal.\n' >&2
            ;;
    esac
    if [[ -n "$pids" ]]; then
        printf '         - Stop the process: %skill %s%s\n' "$C_BOLD" "$(echo $pids)" "$C_RESET" >&2
        printf '           (if it does not stop, use: %skill -9 %s%s)\n' "$C_BOLD" "$(echo $pids)" "$C_RESET" >&2
    else
        printf '         - Find the process with: %slsof -nP -iTCP:%s -sTCP:LISTEN%s and stop it.\n' "$C_BOLD" "$port" "$C_RESET" >&2
    fi
    printf '         - Then run this script again.\n\n' >&2
    return 1
}

warn_if_no_api_key() {
    case ",${SPRING_PROFILES_ACTIVE:-}," in
        *,demo,* | *,ollama,*) return 0 ;;
    esac
    if [[ -z "${OPENAI_API_KEY:-}" ]]; then
        warn "OPENAI_API_KEY is not set, so LIVE (OpenAI) requests will fail."
        printf '         Set it with: %sexport OPENAI_API_KEY="your-api-key"%s\n' "$C_BOLD" "$C_RESET" >&2
        printf '         Or run without a key: %sSPRING_PROFILES_ACTIVE=demo %s%s\n\n' "$C_BOLD" "$0" "$C_RESET" >&2
    fi
}
