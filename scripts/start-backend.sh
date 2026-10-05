#!/usr/bin/env bash
# Starts the Spring Boot backend on port 8080. Extra arguments are passed to Maven.
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

configure_java || exit 1
check_port "$BACKEND_PORT" "backend" || exit 1
load_openai_key || exit 1
warn_if_no_api_key

info "Starting backend on http://localhost:$BACKEND_PORT (profiles: ${SPRING_PROFILES_ACTIVE:-default})"
cd "$BACKEND_DIR"
exec sh ./mvnw spring-boot:run "$@"
