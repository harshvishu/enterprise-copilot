#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
BACKEND="$REPO_ROOT/backend/src/main/java/com/enterprise/copilot"
TESTS="$REPO_ROOT/backend/src/test/java/com/enterprise/copilot"
REFERENCE="$REPO_ROOT/workshop/reference"
ORCHESTRATOR="$BACKEND/orchestration/PipelineOrchestrator.java"
AGENT="$BACKEND/agents/confluence/ConfluenceAgent.java"
AGENT_TEST="$TESTS/agents/confluence/ConfluenceAgentTest.java"
REFERENCE_AGENT="$REFERENCE/ConfluenceAgent.java"
REFERENCE_TEST="$REFERENCE/ConfluenceAgentTest.java"
PATCH_FILE="$REFERENCE/pipeline-orchestrator-confluence.patch"
FORCE=0

usage() {
    printf 'Usage: %s {reset|apply} [--force]\n' "$0" >&2
    exit 2
}

fail() {
    printf 'Confluence exercise: %s\n' "$1" >&2
    exit 1
}

[[ $# -ge 1 && $# -le 2 ]] || usage
ACTION="$1"
if [[ $# -eq 2 ]]; then
    [[ "$2" == "--force" ]] || usage
    FORCE=1
fi
[[ "$ACTION" == "reset" || "$ACTION" == "apply" ]] || usage

for file in "$ORCHESTRATOR" "$REFERENCE_AGENT" "$REFERENCE_TEST" "$PATCH_FILE"; do
    [[ -f "$file" ]] || fail "Required exercise asset is missing: ${file#"$REPO_ROOT"/}"
done

for marker in \
    '// CONFLUENCE_EXERCISE:IMPORT_BEGIN' \
    '// CONFLUENCE_EXERCISE:IMPORT_END' \
    '// CONFLUENCE_EXERCISE:FIELD_BEGIN' \
    '// CONFLUENCE_EXERCISE:FIELD_END' \
    '// CONFLUENCE_EXERCISE:PARAMETER_BEGIN' \
    '// CONFLUENCE_EXERCISE:PARAMETER_END' \
    '// CONFLUENCE_EXERCISE:ASSIGNMENT_BEGIN' \
    '// CONFLUENCE_EXERCISE:ASSIGNMENT_END' \
    '// CONFLUENCE_EXERCISE:CALL_BEGIN' \
    '// CONFLUENCE_EXERCISE:CALL_END'; do
    marker_count="$(grep -Fc "$marker" "$ORCHESTRATOR" || true)"
    [[ "$marker_count" == 1 ]] || fail "Expected one owned marker '$marker'; refusing to edit the orchestrator."
done

git_apply_check() {
    git -C "$REPO_ROOT" apply --check "$@" >/dev/null 2>&1
}

exercise_state() {
    if git_apply_check "$PATCH_FILE"; then
        printf 'reference'
    elif git_apply_check --reverse "$PATCH_FILE"; then
        printf 'starter'
    else
        printf 'conflict'
    fi
}

check_asset_conflicts() {
    local destination="$1"
    local reference="$2"
    local verb="$3"

    if [[ -e "$destination" ]] && ! cmp -s "$reference" "$destination" && [[ "$FORCE" -ne 1 ]]; then
        fail "${destination#"$REPO_ROOT"/} contains participant changes. Refusing to $verb it; use --force to replace only this exercise-owned file."
    fi
}

copy_reference() {
    local destination="$1"
    local reference="$2"

    if [[ -e "$destination" ]] && cmp -s "$reference" "$destination"; then
        return
    fi
    cp "$reference" "$destination"
}

remove_reference() {
    local destination="$1"
    local reference="$2"

    if [[ -e "$destination" ]] && cmp -s "$reference" "$destination"; then
        rm -f -- "$destination"
    elif [[ -e "$destination" && "$FORCE" -eq 1 ]]; then
        rm -f -- "$destination"
    fi
}

verify_starter_infrastructure() {
    local file
    for file in \
        "$BACKEND/tools/ConfluenceTool.java" \
        "$BACKEND/agents/requirements/RequirementsAgent.java" \
        "$BACKEND/infrastructure/ai/DemoAgentAiClient.java" \
        "$BACKEND/infrastructure/ai/DemoResponses.java" \
        "$REPO_ROOT/backend/src/main/resources/demo-data/confluence.md" \
        "$REPO_ROOT/backend/src/test/java/com/enterprise/copilot/EnterpriseCopilotIntegrationTest.java"; do
        [[ -f "$file" ]] || fail "Starter infrastructure is missing: ${file#"$REPO_ROOT"/}"
    done
    grep -Fq 'private String withConfluenceActivity' "$ORCHESTRATOR" \
        || fail 'The supplied Confluence activity wrapper is missing.'
}

state="$(exercise_state)"
case "$ACTION" in
    apply)
        [[ "$state" != conflict ]] || fail 'PipelineOrchestrator exercise markers were changed; refusing to overwrite them, even with --force.'
        check_asset_conflicts "$AGENT" "$REFERENCE_AGENT" 'replace'
        check_asset_conflicts "$AGENT_TEST" "$REFERENCE_TEST" 'replace'
        if [[ "$state" == starter ]]; then
            git -C "$REPO_ROOT" apply --reverse "$PATCH_FILE"
        fi
        copy_reference "$AGENT" "$REFERENCE_AGENT"
        copy_reference "$AGENT_TEST" "$REFERENCE_TEST"
        [[ "$(exercise_state)" == reference ]] || fail 'Could not verify the reference solution after apply.'
        printf 'Confluence exercise: APPLY\n\n'
        printf '[OK] Added ConfluenceAgent\n'
        printf '[OK] Added PipelineOrchestrator wiring\n'
        printf '[OK] Preserved existing workshop infrastructure\n\n'
        printf 'Reference solution is ready.\n\n'
        printf 'Expected UB-4823 behavior:\n'
        printf 'Confluence -> Rhea -> Nova -> Sentinel -> Atlas -> Human Approval\n'
        ;;
    reset)
        [[ "$state" != conflict ]] || fail 'PipelineOrchestrator exercise markers were changed; refusing to overwrite them, even with --force.'
        check_asset_conflicts "$AGENT" "$REFERENCE_AGENT" 'remove'
        check_asset_conflicts "$AGENT_TEST" "$REFERENCE_TEST" 'remove'
        if [[ "$state" == reference ]]; then
            git -C "$REPO_ROOT" apply "$PATCH_FILE"
        fi
        remove_reference "$AGENT" "$REFERENCE_AGENT"
        remove_reference "$AGENT_TEST" "$REFERENCE_TEST"
        verify_starter_infrastructure
        [[ "$(exercise_state)" == starter ]] || fail 'Could not verify the participant starter after reset.'
        [[ ! -e "$AGENT" && ! -e "$AGENT_TEST" ]] || fail 'ConfluenceAgent solution files remain after reset.'
        printf 'Confluence exercise: RESET\n\n'
        printf '[OK] Removed ConfluenceAgent solution\n'
        printf '[OK] Removed pipeline wiring\n'
        printf '[OK] Preserved ConfluenceTool\n'
        printf '[OK] Preserved approved policy document\n\n'
        printf 'Participant starter is ready.\n\n'
        printf 'Expected UB-4823 behavior:\n'
        printf 'Rhea -> Human clarification\n'
        ;;
esac
