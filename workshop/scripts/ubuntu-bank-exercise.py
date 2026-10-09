#!/usr/bin/env python3
"""Offline, lossless reset of LocalRepositoryTool's workspace (stdlib only)."""
import argparse
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import uuid
from urllib.parse import urlparse

PROJECT = Path(__file__).resolve().parents[2]
BRANCH = "workshop-integration"


class Refused(RuntimeError):
    pass


def git(path, *args):
    result = subprocess.run(["git", "-C", str(path), *args], capture_output=True,
                            env={**os.environ, "GIT_TERMINAL_PROMPT": "0", "GIT_OPTIONAL_LOCKS": "0"})
    if result.returncode:
        raise Refused(f"Git operation failed in {path}: {result.stderr.decode(errors='replace').strip()}")
    return result.stdout.decode("utf-8")


def configure(path):
    git(path, "config", "user.name", "Enterprise Copilot Workshop")
    git(path, "config", "user.email", "workshop@example.invalid")


def sources(path):
    result = {}
    for name in git(path, "ls-files", "-z").split("\0"):
        if not (re.fullmatch(r"(app|tests)/[A-Za-z0-9_/-]+\.py", name)
                or name in {"README.md", "pytest.ini", "requirements.txt", ".gitignore"}):
            continue
        file = path / name
        if ".." in Path(name).parts or any(p.is_symlink() for p in [file, *file.parents]):
            raise Refused(f"Unsafe baseline source path: {name}")
        result[name] = file.read_bytes().decode("utf-8")
    if sum(len(v.encode()) for v in result.values()) > 256_000:
        raise Refused("Baseline source exceeds LocalRepositoryTool's limit.")
    return result


def fingerprint(files):
    digest = hashlib.sha256()
    for name, content in sorted(files.items()):
        digest.update(name.encode() + b"\0" + content.encode() + b"\0")
    return digest.hexdigest()


def identity(path):
    if not (path / ".git").is_dir():
        raise Refused(f"Not a standalone Git repository: {path}")
    return git(path, "rev-parse", "HEAD").strip() + "\n" + fingerprint(sources(path))


def checked_path(value):
    path = Path(value).absolute()
    if any(p.is_symlink() for p in [path, *path.parents]):
        raise Refused(f"Symlink paths are not accepted: {path}")
    return path.resolve()


def ensure_backend_stopped(urls):
    # Refuse even idle servers: checking pipeline state alone leaves a start/reset race.
    try:
        result = subprocess.run(["lsof", "-a", "-c", "java", "-d", "cwd", "-Fn"],
                                capture_output=True, text=True)
    except FileNotFoundError as exc:
        raise Refused("lsof is required to verify that the backend is stopped.") from exc
    if result.returncode not in (0, 1) or result.stderr.strip():
        raise Refused("Cannot verify backend processes with lsof.")
    for line in result.stdout.splitlines():
        if line.startswith("n") and Path(line[1:]).resolve().is_relative_to(PROJECT):
            raise Refused("A project Java process is running. Stop the backend before apply/reset.")
    for url in urls:
        parsed = urlparse(url)
        if parsed.scheme != "http" or parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
            raise Refused("Backend URLs must use local HTTP; specify the actual backend port.")
        try:
            with socket.create_connection((parsed.hostname, parsed.port or 80), timeout=0.3):
                raise Refused(f"Backend port is open ({url}). Stop it before apply/reset.")
        except (ConnectionRefusedError, TimeoutError):
            pass
        except OSError as exc:
            raise Refused(f"Cannot verify backend port: {exc}") from exc


class Exercise:
    def __init__(self, baseline, root):
        self.baseline = checked_path(baseline)
        self.root = checked_path(root)
        self.state = self.root.with_name(self.root.name + ".workshop")
        managed = PROJECT / ".copilot-repository"
        for path in (self.root, self.state):
            if (self.baseline.is_relative_to(path) or path.is_relative_to(self.baseline)
                    or PROJECT.is_relative_to(path)
                    or (path.is_relative_to(PROJECT) and not
                        (path.is_relative_to(managed) or path == managed.with_name(managed.name + ".workshop")))):
                raise Refused("Workspace/state must be separate from the bank and Enterprise Copilot source.")
        self.manifest = self.state / "baseline.json"
        self.seed = self.state / "baseline"

    def metadata(self):
        if not self.manifest.exists():
            if self.state.exists() and any(p.name != "lock" for p in self.state.iterdir()):
                raise Refused(f"Unrecognized state directory; preserve and inspect {self.state}")
            return None
        data = json.loads(self.manifest.read_text())
        if (data.get("version") != 1 or data.get("root") != str(self.root)
                or data.get("baseline") != str(self.baseline)):
            raise Refused("Baseline manifest does not match this workspace.")
        if identity(self.baseline) != data["identity"]:
            raise Refused("Original bank baseline changed. Use a new workspace root; no files were restored.")
        if (git(self.seed, "rev-parse", "HEAD").strip() != data["seed_commit"]
                or git(self.seed, "status", "--porcelain", "--ignored").strip()
                or fingerprint(sources(self.seed)) != data["identity"].split("\n")[1]):
            raise Refused("Pinned baseline was changed; refusing reset.")
        return data

    def clean_baseline(self, data):
        if not self.root.is_dir() or {p.name for p in self.root.iterdir()} != {"integration", "baseline.fingerprint"}:
            return False
        repo = self.root / "integration"
        if not (repo / ".git").is_dir():
            return False
        return (self.root.joinpath("baseline.fingerprint").read_text() == data["identity"]
                and git(repo, "rev-parse", "HEAD").strip() == data["seed_commit"]
                and git(repo, "branch", "--show-current").strip() == BRANCH
                and git(repo, "branch", "--format=%(refname:short)").splitlines() == [BRANCH]
                and not git(repo, "status", "--porcelain", "--ignored").strip()
                and git(repo, "fsck", "--no-reflogs").strip() == "")

    def pin(self):
        baseline_identity = identity(self.baseline)
        old_pin = self.root / "baseline.fingerprint"
        if old_pin.exists() and old_pin.read_text() != baseline_identity:
            raise Refused("Existing workspace belongs to a different bank baseline. Use a new root.")
        git(self.state, "clone", "--no-local", "--", str(self.baseline), str(self.seed))
        configure(self.seed)
        git(self.seed, "checkout", "--detach")
        for name, content in sources(self.baseline).items():
            (self.seed / name).write_bytes(content.encode())
        git(self.seed, "add", "--", ".")
        if git(self.seed, "diff", "--cached", "--name-only").strip():
            git(self.seed, "commit", "-m", "Snapshot workshop baseline")
        # Remove cloned branch refs, never repository files or participant branches.
        for branch in git(self.seed, "branch", "--format=%(refname:short)").splitlines():
            if not branch.startswith("("):
                git(self.seed, "branch", "-D", branch)
        data = {"version": 1, "root": str(self.root), "baseline": str(self.baseline),
                "identity": baseline_identity, "seed_commit": git(self.seed, "rev-parse", "HEAD").strip()}
        self.manifest.write_text(json.dumps(data, indent=2) + "\n")
        return data

    def restore(self, action, confirm, urls):
        ensure_backend_stopped(urls)
        data = self.metadata()
        if data and self.clean_baseline(data):
            print("Already at the verified baseline; no changes made.")
            return
        if action == "reset" and data is None:
            raise Refused("No pinned baseline. Run apply first to establish it; reset will not guess.")
        # Confirmation is required for baseline adoption AND every workspace rotation.
        if confirm != str(self.root):
            raise Refused(f"Explicit confirmation required: --confirm {self.root}\n"
                          "The current workspace will be retained in a complete archive, never discarded.")
        if data is None:
            data = self.pin()
        stage = self.state / ("prepared-" + uuid.uuid4().hex)
        stage.mkdir()
        integration = stage / "integration"
        git(stage, "clone", "--no-local", "--", str(self.seed), str(integration))
        configure(integration)
        git(integration, "checkout", "-B", BRANCH, data["seed_commit"])
        stage.joinpath("baseline.fingerprint").write_text(data["identity"])
        ensure_backend_stopped(urls)
        self.metadata()  # Recheck original and seed immediately before rotation.
        archive = None
        if self.root.exists():
            archive = self.state / ("archive-" + uuid.uuid4().hex)
            self.root.rename(archive)
        try:
            stage.rename(self.root)
        except OSError:
            if archive:
                archive.rename(self.root)
            raise
        if not self.clean_baseline(data):
            raise Refused("Post-reset verification failed. All files retained; inspect status before continuing.")
        print(f"Verified baseline restored: {data['seed_commit']}\nWorkspace: {self.root}")
        if archive:
            print(f"Previous workspace preserved: {archive}\nOld run records cannot resume or merge from their former paths.")

    def status(self):
        print(f"Original bank (read only): {self.baseline}\nExecution workspace: {self.root}\nArchives/state: {self.state}")
        print(f"Original identity: {identity(self.baseline)}")
        data = self.metadata()
        print("Pinned baseline: " + (data["seed_commit"] if data else "not established (apply first)"))
        if self.root.exists():
            print("Workspace entries: " + ", ".join(sorted(p.name for p in self.root.iterdir())))
        repo = self.root / "integration"
        if (repo / ".git").is_dir():
            print(f"Integration HEAD: {git(repo, 'rev-parse', 'HEAD').strip()}")
            print("Branches:\n" + git(repo, "branch", "--format=%(refname:short)"), end="")
            print("Changes (including ignored files):\n" + (git(repo, "status", "--short", "--ignored") or "clean\n"), end="")
        runs = self.root / "runs"
        if runs.is_dir():
            for run in sorted(runs.iterdir()):
                print(f"Run workspace: {run}")
                if (run / ".git").is_dir() and not run.is_symlink():
                    print(git(run, "log", "-1", "--format=%h %s"), end="")
                    print(git(run, "status", "--short", "--ignored"), end="")
        if self.state.exists():
            for path in sorted(self.state.iterdir()):
                if path.name.startswith(("archive-", "prepared-")):
                    print(f"Retained workspace: {path}")


@contextlib.contextmanager
def operation_lock(exercise):
    exercise.state.mkdir(parents=True, exist_ok=True)
    with (exercise.state / "lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise Refused("Another workshop operation is running.") from exc
        yield


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["reset", "apply", "status"])
    parser.add_argument("--baseline", default=os.environ.get("COPILOT_REPOSITORY_PATH", "../ubuntu-bank-demo"))
    parser.add_argument("--workspace-root", default=os.environ.get("COPILOT_REPOSITORY_WORKSPACE_ROOT", "../.copilot-repository"))
    parser.add_argument("--confirm", help="Exact absolute workspace path; explicitly authorize baseline adoption/archiving")
    parser.add_argument("--backend-url", action="append", default=[], help="Additional local backend URL/port to check")
    args = parser.parse_args()
    def configured(value):
        path = Path(value)
        return path if path.is_absolute() else PROJECT / "backend" / path
    try:
        exercise = Exercise(configured(args.baseline), configured(args.workspace_root))
        if args.action == "status":
            exercise.status()
        else:
            # Check before creating even the lock/state folder.
            urls = ["http://127.0.0.1:8080", "http://127.0.0.1:8081", *args.backend_url]
            ensure_backend_stopped(urls)
            exercise.metadata()
            with operation_lock(exercise):
                exercise.restore(args.action, args.confirm, urls)
        return 0
    except (Refused, OSError, ValueError, KeyError) as exc:
        print(f"Ubuntu Bank exercise: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
