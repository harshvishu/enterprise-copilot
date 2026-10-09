package com.enterprise.copilot.tools;

import com.enterprise.copilot.domain.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class LocalRepositoryToolTest {
    @TempDir Path directory;
    private static final Path BANK = Path.of("../ubuntu-bank-demo").toAbsolutePath().normalize();

    static void git(Path cwd, String... args) throws Exception {
        List<String> command = new ArrayList<>(List.of("git", "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgSign=false"));
        command.addAll(List.of(args));
        Process process = new ProcessBuilder(command).directory(cwd.toFile()).redirectErrorStream(true).start();
        String output = new String(process.getInputStream().readAllBytes());
        assertThat(process.waitFor()).as(output).isZero();
    }

    LocalRepositoryTool tool(long timeout) throws Exception {
        Path baseline = directory.resolve("baseline");
        Files.createDirectories(baseline);
        for (String folder : List.of("app", "tests")) {
            try (var paths = Files.walk(BANK.resolve(folder))) {
                for (Path source : paths.filter(p -> p.toString().endsWith(".py")).toList()) {
                    Path target = baseline.resolve(BANK.relativize(source));
                    Files.createDirectories(target.getParent());
                    Files.copy(source, target);
                }
            }
        }
        for (String file : List.of("README.md", "requirements.txt", "pytest.ini", ".gitignore"))
            Files.copy(BANK.resolve(file), baseline.resolve(file));
        git(baseline, "init");
        git(baseline, "config", "user.name", "Repository test");
        git(baseline, "config", "user.email", "test@example.invalid");
        git(baseline, "add", ".");
        git(baseline, "commit", "-m", "Baseline fixture");
        return new LocalRepositoryTool(baseline.toString(), directory.resolve("workspaces").toString(),
                BANK.resolve(".venv/bin/python").toString(), timeout);
    }

    static CodeChangeSet changes(String path, String content) {
        return new CodeChangeSet(List.of(new FileChange(path, FileChange.ChangeType.CREATE, content)),
                "MODEL DIFF MUST NOT BE USED", "test fixture", List.of("test"), List.of(), true);
    }

    @Test void actualDiffTestsApprovalAndSeparateMergeLeaveBaselineUntouched() throws Exception {
        var tool = tool(30);
        var prepared = tool.prepare(UUID.randomUUID());
        var second = tool.prepare(UUID.randomUUID());
        List<String> steps = new ArrayList<>();
        var candidate = tool.applyAndTest(prepared, changes("tests/test_added.py", "def test_added():\n    assert 2 + 2 == 4\n"), steps::add);
        assertThat(steps).containsExactly("APPLY_FILES", "GIT_DIFF", "PYTEST");
        assertThat(candidate.testsPassed()).as(candidate.testRun().stdout() + candidate.testRun().stderr()).isTrue();
        assertThat(candidate.testRun().collected()).isEqualTo(12);
        assertThat(tool.diff(candidate)).contains("diff --git a/tests/test_added.py", "+    assert 2 + 2 == 4").doesNotContain("MODEL DIFF");
        assertThatThrownBy(() -> tool.mergeApproved(candidate)).isInstanceOf(IllegalStateException.class);
        var merged = tool.mergeApproved(candidate.reviewed().approved());
        assertThat(merged.mergedCommit()).isEqualTo(candidate.candidateCommit());
        assertThat(tool.mergeApproved(merged)).isEqualTo(merged);
        assertThat(directory.resolve("baseline/tests/test_added.py")).doesNotExist();
        assertThat(directory.resolve("workspaces/integration/tests/test_added.py")).exists();
        var stale = tool.applyAndTest(second, changes("tests/test_other.py", "def test_other():\n    assert True\n"));
        assertThatThrownBy(() -> tool.mergeApproved(stale.reviewed().approved())).hasMessageContaining("destination changed");
        git(directory.resolve("baseline"), "diff", "--exit-code");
    }

    @Test void failedTestsBlockMergeDespiteModelSuccessFlag() throws Exception {
        var tool = tool(30);
        var candidate = tool.applyAndTest(tool.prepare(UUID.randomUUID()), changes("tests/test_failed.py", "def test_failed():\n    assert False\n"));
        assertThat(candidate.testsPassed()).isFalse();
        assertThat(candidate.testRun().exitCode()).isEqualTo(1);
        assertThat(candidate.testRun().failures()).isEqualTo(1);
        assertThatThrownBy(() -> tool.mergeApproved(candidate.reviewed().approved())).isInstanceOf(IllegalStateException.class);
    }

    @Test void protectedTestsCannotWriteRepositoriesReadHostSecretsOrUseNetworking() throws Exception {
        var tool = tool(30);
        Path secret = directory.resolve("secret.txt");
        Files.writeString(secret, "host secret");
        String code = "import socket\nfrom pathlib import Path\nimport pytest\n"
                + "def test_protection():\n"
                + "    for target in [Path('app/forbidden.py'), Path('" + directory.resolve("baseline/app/forbidden.py") + "'), Path('" + secret + "')]:\n"
                + "        with pytest.raises(PermissionError):\n            target.write_text('forbidden')\n"
                + "    with pytest.raises(PermissionError):\n        Path('" + secret + "').read_text()\n"
                + "    with pytest.raises(PermissionError):\n        socket.socket().connect(('127.0.0.1', 8080))\n";
        var candidate = tool.applyAndTest(tool.prepare(UUID.randomUUID()), changes("tests/test_protection.py", code));
        assertThat(candidate.testsPassed()).as(candidate.testRun().stdout() + candidate.testRun().stderr()).isTrue();
        assertThat(secret).hasContent("host secret");
    }

    @Test void invalidPathsAreRejectedAndCandidateTamperingInvalidatesApproval() throws Exception {
        var tool = tool(30);
        var run = tool.prepare(UUID.randomUUID());
        for (String path : List.of("../escape.py", "app/../../escape.py", ".git/config", "pytest.ini", "/tmp/escape.py"))
            assertThatThrownBy(() -> tool.applyAndTest(run, changes(path, "x"))).isInstanceOf(IllegalArgumentException.class);
        var candidate = tool.applyAndTest(run, changes("tests/test_added.py", "def test_added():\n    assert True\n"));
        Files.writeString(Path.of(candidate.workspace()).resolve("app/main.py"), "tampered");
        assertThatThrownBy(() -> tool.verifyCandidate(candidate)).hasMessageContaining("Candidate changed");
        assertThatThrownBy(() -> tool.mergeApproved(candidate.reviewed().approved())).hasMessageContaining("Candidate changed");
    }

    @Test void timeoutIsRecordedAndCannotPass() throws Exception {
        var tool = tool(1);
        var candidate = tool.applyAndTest(tool.prepare(UUID.randomUUID()), changes("tests/test_timeout.py", "import time\ndef test_timeout():\n    time.sleep(10)\n"));
        assertThat(candidate.testRun().timedOut()).isTrue();
        assertThat(candidate.testsPassed()).isFalse();
    }
}
