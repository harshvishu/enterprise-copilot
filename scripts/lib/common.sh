# Shared helpers for the start scripts. Source this file; do not run it directly.

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
BACKEND_PORT=8081
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

use_java_home() {
    local home="$1" version major
    [[ -x "$home/bin/java" && -x "$home/bin/javac" ]] || return 1
    version="$("$home/bin/java" -version 2>&1)" || return 1
    major="$(printf '%s\n' "$version" | awk -F'"' '/version/ {split($2, parts, "."); print parts[1]; exit}')"
    [[ "$major" =~ ^[0-9]+$ ]] && [[ "$major" -ge 21 ]] || return 1
    "$home/bin/javac" -version >/dev/null 2>&1 || return 1
    export JAVA_HOME="$home"
    export PATH="$JAVA_HOME/bin:$PATH"
}

configure_java() {
    local home
    if [[ -n "${JAVA_HOME:-}" ]]; then
        use_java_home "$JAVA_HOME" && return 0
        error "JAVA_HOME is not a working JDK 21 or newer: $JAVA_HOME"
        printf '       Set JAVA_HOME to your JDK installation, or unset it to enable discovery.\n' >&2
        return 1
    fi

    if command -v java >/dev/null 2>&1; then
        home="$(java -XshowSettings:properties -version 2>&1 | awk -F' = ' '/^[[:space:]]*java.home = / {print $2; exit}')"
        if [[ -n "$home" ]] && use_java_home "$home"; then
            return 0
        fi
    fi

    if [[ "$(uname -s)" == Darwin ]]; then
        home="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
        if [[ -n "$home" ]] && use_java_home "$home"; then
            return 0
        fi
        for home in \
            /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
            /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
            /opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home \
            /usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home; do
            use_java_home "$home" && return 0
        done
    fi

    error "No working JDK 21 or newer was found."
    printf '       Install a JDK and set JAVA_HOME to its installation directory.\n' >&2
    return 1
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

load_openai_key() {
    local line value
    if [[ -n "${OPENAI_API_KEY:-}" || ! -f "$REPO_ROOT/.env" ]]; then
        return 0
    fi
    if [[ ! -r "$REPO_ROOT/.env" ]]; then
        error "The project .env file is not readable."
        return 1
    fi
    while IFS= read -r line || [[ -n "$line" ]]; do
        line="${line%$'\r'}"
        if [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?OPENAI_API_KEY[[:space:]]*=[[:space:]]*(.*)$ ]]; then
            value="${BASH_REMATCH[2]}"
            value="${value%%[[:space:]]#*}"
            value="${value%"${value##*[![:space:]]}"}"
            case "$value" in
                \"*\" | \'*\') value="${value:1:${#value}-2}" ;;
                \"* | \'*)
                    error "OPENAI_API_KEY in .env has an unmatched quote."
                    return 1
                    ;;
            esac
            export OPENAI_API_KEY="$value"
            return 0
        fi
    done < "$REPO_ROOT/.env"
}

warn_if_no_api_key() {
    case ",${SPRING_PROFILES_ACTIVE:-}," in
        *,demo,* | *,ollama,*) return 0 ;;
    esac
    if [[ -z "${OPENAI_API_KEY:-}" ]]; then
        warn "OPENAI_API_KEY is not set. The app starts in DEMO mode; LIVE runs will report a missing key."
        printf '         To use LIVE, add OPENAI_API_KEY=your-api-key to %s/.env (ignored by Git).\n' "$REPO_ROOT" >&2
        printf '         The key is read on each run, so no restart is needed.\n\n' >&2
    fi
}
