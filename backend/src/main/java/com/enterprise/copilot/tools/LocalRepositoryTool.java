package com.enterprise.copilot.tools;

import com.enterprise.copilot.domain.*;
import com.enterprise.copilot.domain.RepositoryExecution.TestRun;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.w3c.dom.Element;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;

/** Fixed local Git/pytest operations. Models provide file data, never shell commands. */
@Component
public class LocalRepositoryTool {
    private final Path baseline;
    private final Path root;
    private final Path python;
    private final long timeoutSeconds;
    private static final int OUTPUT_LIMIT = 64_000;
    private static final int SOURCE_LIMIT = 256_000;

    public LocalRepositoryTool(
            @Value("${copilot.repository.path:../ubuntu-bank-demo}") String baseline,
            @Value("${copilot.repository.workspace-root:../.copilot-repository}") String root,
            @Value("${copilot.repository.python:../ubuntu-bank-demo/.venv/bin/python}") String python,
            @Value("${copilot.repository.test-timeout-seconds:60}") long timeoutSeconds) {
        this.baseline = canonical(Path.of(baseline).toAbsolutePath().normalize());
        this.root = canonical(Path.of(root).toAbsolutePath().normalize());
        this.python = Path.of(python).toAbsolutePath().normalize();
        this.timeoutSeconds = Math.max(1, timeoutSeconds);
    }

    private static Path canonical(Path path) {
        try {
            if (Files.exists(path)) return path.toRealPath();
            return canonical(path.getParent()).resolve(path.getFileName());
        } catch (IOException ex) { throw new IllegalStateException("Cannot resolve repository path", ex); }
    }

    public synchronized RepositoryExecution prepare(UUID id) {
        try {
            if (!Files.isDirectory(baseline.resolve(".git")))
                throw new IllegalStateException("Ubuntu Bank must be a local Git repository.");
            if (root.startsWith(baseline) || baseline.startsWith(root))
                throw new IllegalStateException("Workspace root must be separate from the baseline.");
            Files.createDirectories(root);
            Map<String, String> seed = readSources(baseline);
            String fingerprint = fingerprint(seed);
            String baselineCommit = git(baseline, "rev-parse", "HEAD").trim();
            Path integration = root.resolve("integration");
            if (!Files.exists(integration)) {
                git(root, "clone", "--no-local", "--", baseline.toString(), integration.toString());
                configure(integration);
                // Snapshot reviewed local baseline edits without committing to the baseline itself.
                for (var entry : seed.entrySet())
                    Files.writeString(safePath(integration, entry.getKey()), entry.getValue());
                git(integration, "add", "--", ".");
                if (!git(integration, "diff", "--cached", "--name-only").isBlank())
                    git(integration, "commit", "-m", "Snapshot workshop baseline");
                git(integration, "checkout", "-B", "workshop-integration");
                Files.writeString(root.resolve("baseline.fingerprint"), baselineCommit + "\n" + fingerprint);
            }
            if (!Files.readString(root.resolve("baseline.fingerprint"))
                    .equals(baselineCommit + "\n" + fingerprint))
                throw new IllegalStateException("Baseline changed since integration was initialized. Use a new workspace root.");
            if (!git(integration, "status", "--porcelain").isBlank())
                throw new IllegalStateException("Integration clone has uncommitted changes.");
            Path run = root.resolve("runs").resolve(id.toString());
            if (Files.exists(run)) throw new IllegalStateException("Run workspace already exists.");
            Files.createDirectories(run.getParent());
            git(root, "clone", "--no-local", "--", integration.toString(), run.toString());
            configure(run);
            String branch = "copilot/" + id;
            String base = git(run, "rev-parse", "HEAD").trim();
            git(run, "checkout", "-b", branch);
            return new RepositoryExecution(run.toString(), branch, base, null, readSources(run),
                    null, null, null, null, baselineCommit, fingerprint);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot prepare isolated repository", ex);
        }
    }

    public RepositoryExecution applyAndTest(RepositoryExecution execution, CodeChangeSet proposal) {
        return applyAndTest(execution, proposal, step -> {});
    }

    public RepositoryExecution applyAndTest(RepositoryExecution execution, CodeChangeSet proposal,
                                            java.util.function.Consumer<String> activity) {
        Path run = workspace(execution);
        verifyBaseline(execution);
        if (proposal.files() == null || proposal.files().isEmpty())
            throw new IllegalArgumentException("No repository file changes were supplied.");
        Map<Path, FileChange> writes = new LinkedHashMap<>();
        int bytes = 0;
        for (FileChange file : proposal.files()) {
            if (file == null || file.path() == null || file.content() == null || file.changeType() == null)
                throw new IllegalArgumentException("Incomplete file change.");
            if (!file.path().matches("(app|tests)/[A-Za-z0-9_/-]+\\.py"))
                throw new IllegalArgumentException("Only app/ and tests/ Python files may be changed.");
            Path target = safePath(run, file.path());
            if (writes.put(target, file) != null) throw new IllegalArgumentException("Duplicate file path.");
            if (Files.exists(target) != (file.changeType() == FileChange.ChangeType.MODIFY))
                throw new IllegalArgumentException("CREATE/MODIFY does not match the existing file: " + file.path());
            bytes += file.content().getBytes(StandardCharsets.UTF_8).length;
            if (bytes > SOURCE_LIMIT) throw new IllegalArgumentException("Repository change is too large.");
        }
        try {
            activity.accept("APPLY_FILES");
            // A revision starts from the last candidate; all writes were checked before applying any.
            for (var write : writes.entrySet()) {
                Files.createDirectories(write.getKey().getParent());
                Files.writeString(write.getKey(), write.getValue().content());
            }
            git(run, "add", "--", "app", "tests");
            if (!git(run, "diff", "--cached", "--name-only").isBlank())
                git(run, "commit", "-m", "Nova workshop candidate");
            String candidate = git(run, "rev-parse", "HEAD").trim();
            if (candidate.equals(execution.baseCommit()))
                throw new IllegalArgumentException("Nova produced no actual repository changes.");
            activity.accept("GIT_DIFF");
            if (git(run, "diff", "--no-ext-diff", "--no-textconv", execution.baseCommit(), candidate,
                    "--", "app", "tests").isBlank())
                throw new IllegalStateException("Candidate has no reviewable Git diff.");
            activity.accept("PYTEST");
            TestRun tests = runTests(run, candidate);
            verifyBaseline(execution);
            if (!git(run, "status", "--porcelain", "--untracked-files=all").isBlank())
                throw new IllegalStateException("Test execution changed repository files.");
            return execution.candidate(candidate, readSources(run), tests);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot apply repository changes", ex);
        }
    }

    public String diff(RepositoryExecution execution) {
        return git(workspace(execution), "diff", "--no-ext-diff", "--no-textconv",
                execution.baseCommit(), execution.candidateCommit(), "--", "app", "tests");
    }

    public void verifyCandidate(RepositoryExecution execution) {
        verifyBaseline(execution);
        Path run = workspace(execution);
        if (execution.candidateCommit() == null
                || !execution.candidateCommit().equals(git(run, "rev-parse", "HEAD").trim())
                || !git(run, "status", "--porcelain", "--untracked-files=all").isBlank())
            throw new IllegalStateException("Candidate changed after tests or review. Run a fresh review.");
    }

    public synchronized RepositoryExecution mergeApproved(RepositoryExecution execution) {
        verifyCandidate(execution);
        if (!execution.testsPassed() || !Objects.equals(execution.candidateCommit(), execution.reviewedCommit())
                || !Objects.equals(execution.candidateCommit(), execution.approvedCommit()))
            throw new IllegalStateException("This exact candidate requires passing tests, review, and explicit approval.");
        if (execution.mergedCommit() != null) return execution;
        Path destination = root.resolve("integration");
        if (!git(destination, "branch", "--show-current").trim().equals("workshop-integration")
                || !git(destination, "status", "--porcelain").isBlank()
                || !git(destination, "rev-parse", "HEAD").trim().equals(execution.baseCommit()))
            throw new IllegalStateException("Integration destination changed. Start another reviewed run; no merge was performed.");
        git(destination, "fetch", "--no-tags", "--", workspace(execution).toString(), execution.candidateCommit());
        git(destination, "merge", "--ff-only", execution.candidateCommit());
        return execution.merged(git(destination, "rev-parse", "HEAD").trim());
    }

    private TestRun runTests(Path run, String commit) throws IOException {
        if (!System.getProperty("os.name").startsWith("Mac") || !Files.isExecutable(Path.of("/usr/bin/sandbox-exec")))
            throw new IllegalStateException("Protected pytest execution requires macOS sandbox-exec. No unprotected test process was started.");
        if (!Files.isExecutable(python)) throw new IllegalStateException("Configure the repository Python virtual environment first.");
        Path output = root.resolve("test-results").resolve(UUID.randomUUID().toString());
        Files.createDirectories(output.resolve("tmp"));
        Path report = output.resolve("pytest.xml");
        Path environment = python.getParent().getParent().toRealPath();
        String profile = "(version 1) (allow default) (deny network*) (deny file-write*) "
                + "(deny file-read-data (require-not (require-any (subpath \"/System\") (subpath \"/usr\") (subpath \"/Library\") "
                + "(subpath \"/opt/homebrew\") (subpath " + quote(environment) + ") "
                + "(subpath " + quote(run) + ") (subpath " + quote(output) + ") "
                + "(literal \"/\") (literal \"/dev/null\") (literal \"/dev/random\") (literal \"/dev/urandom\")))) "
                + "(allow file-write* (subpath " + quote(output) + ") (literal \"/dev/null\"))";
        List<String> command = List.of("/usr/bin/sandbox-exec", "-p", profile, python.toString(),
                "-m", "pytest", "-q", "-p", "no:cacheprovider", "--junitxml=" + report, "tests");
        CommandResult result = command(run, command, timeoutSeconds, output.resolve("tmp"));
        int[] counts = counts(report);
        return new TestRun("python -m pytest -q -p no:cacheprovider --junitxml=pytest.xml tests", commit,
                result.exitCode(), result.timedOut(), result.durationMs(), counts[0], counts[1], counts[2], counts[3],
                result.stdout(), result.stderr());
    }

    private int[] counts(Path report) {
        if (!Files.isRegularFile(report) || Files.isSymbolicLink(report)) return new int[]{0, 0, 1, 0};
        try {
            if (Files.size(report) > 2_000_000) return new int[]{0, 0, 1, 0};
            var factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            var suites = factory.newDocumentBuilder().parse(report.toFile()).getElementsByTagName("testsuite");
            int[] counts = new int[4];
            String[] names = {"tests", "failures", "errors", "skipped"};
            for (int i = 0; i < suites.getLength(); i++)
                for (int j = 0; j < names.length; j++)
                    counts[j] += Integer.parseInt(((Element) suites.item(i)).getAttribute(names[j]));
            if (Arrays.stream(counts).anyMatch(n -> n < 0) || counts[3] > counts[0])
                return new int[]{0, 0, 1, 0};
            return counts;
        } catch (Exception ex) { return new int[]{0, 0, 1, 0}; }
    }

    private Map<String, String> readSources(Path directory) {
        Map<String, String> files = new TreeMap<>();
        int bytes = 0;
        for (String name : git(directory, "ls-files", "-z").split("\u0000")) {
            if (!(name.matches("(app|tests)/[A-Za-z0-9_/-]+\\.py")
                    || Set.of("README.md", "pytest.ini", "requirements.txt", ".gitignore").contains(name))) continue;
            try {
                Path path = safePath(directory, name);
                if (Files.size(path) > SOURCE_LIMIT) throw new IllegalStateException("Source file is too large.");
                String content = Files.readString(path);
                bytes += content.getBytes(StandardCharsets.UTF_8).length;
                if (bytes > SOURCE_LIMIT) throw new IllegalStateException("Repository context is too large.");
                files.put(name, content);
            } catch (IOException ex) { throw new IllegalStateException("Cannot read source file: " + name, ex); }
        }
        return Collections.unmodifiableMap(files);
    }

    private Path safePath(Path directory, String relative) {
        Path path = directory.resolve(relative).normalize();
        if (Path.of(relative).isAbsolute() || !path.startsWith(directory) || relative.contains("..")
                || relative.contains("\\") || relative.startsWith(".git/"))
            throw new IllegalArgumentException("Unsafe repository path.");
        for (Path current = path; current != null && current.startsWith(directory); current = current.getParent())
            if (Files.isSymbolicLink(current)) throw new IllegalArgumentException("Symlink paths are not allowed.");
        return path;
    }

    private Path workspace(RepositoryExecution execution) {
        if (execution == null || execution.workspace() == null) throw new IllegalStateException("Repository is not prepared.");
        Path path = Path.of(execution.workspace()).toAbsolutePath().normalize();
        if (!path.startsWith(root.resolve("runs")) || !Files.isDirectory(path.resolve(".git")))
            throw new IllegalStateException("Invalid run workspace.");
        return path;
    }

    private void verifyBaseline(RepositoryExecution execution) {
        if (!Objects.equals(execution.baselineCommit(), git(baseline, "rev-parse", "HEAD").trim())
                || !Objects.equals(execution.baselineFingerprint(), fingerprint(readSources(baseline))))
            throw new IllegalStateException("Baseline changed during this run. No integration is permitted.");
    }

    private String fingerprint(Map<String, String> files) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            for (var entry : new TreeMap<>(files).entrySet()) {
                digest.update(entry.getKey().getBytes(StandardCharsets.UTF_8));
                digest.update((byte) 0);
                digest.update(entry.getValue().getBytes(StandardCharsets.UTF_8));
                digest.update((byte) 0);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (Exception ex) { throw new IllegalStateException(ex); }
    }

    private void configure(Path repository) {
        git(repository, "config", "user.name", "Enterprise Copilot Workshop");
        git(repository, "config", "user.email", "workshop@example.invalid");
    }

    private String quote(Path path) {
        return "\"" + path.toString().replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private String git(Path directory, String... arguments) {
        List<String> command = new ArrayList<>(List.of("git", "-c", "core.hooksPath=/dev/null",
                "-c", "core.fsmonitor=false", "-c", "commit.gpgSign=false"));
        command.addAll(List.of(arguments));
        CommandResult result = command(directory, command, 30, null);
        if (result.timedOut() || result.exitCode() != 0)
            throw new IllegalStateException("Local Git operation failed: " + result.stderr());
        if (result.stdout().getBytes(StandardCharsets.UTF_8).length >= OUTPUT_LIMIT)
            throw new IllegalStateException("Git evidence exceeded the output limit; incomplete evidence is not accepted.");
        return result.stdout();
    }

    private record CommandResult(int exitCode, boolean timedOut, long durationMs, String stdout, String stderr) {}

    private CommandResult command(Path directory, List<String> arguments, long seconds, Path temporary) {
        long start = System.nanoTime();
        try {
            ProcessBuilder builder = new ProcessBuilder(arguments).directory(directory.toFile());
            builder.environment().clear();
            builder.environment().putAll(Map.of("PATH", "/opt/homebrew/bin:/usr/bin:/bin", "LANG", "en_US.UTF-8",
                    "GIT_CONFIG_NOSYSTEM", "1", "GIT_CONFIG_GLOBAL", "/dev/null", "GIT_TERMINAL_PROMPT", "0",
                    "PYTHONDONTWRITEBYTECODE", "1", "PYTEST_DISABLE_PLUGIN_AUTOLOAD", "1"));
            if (temporary != null) builder.environment().put("TMPDIR", temporary.toString());
            Process process = builder.start();
            ByteArrayOutputStream stdout = new ByteArrayOutputStream(), stderr = new ByteArrayOutputStream();
            Thread out = Thread.ofVirtual().start(() -> capture(process.getInputStream(), stdout));
            Thread err = Thread.ofVirtual().start(() -> capture(process.getErrorStream(), stderr));
            boolean finished = process.waitFor(seconds, TimeUnit.SECONDS);
            if (!finished) { process.descendants().forEach(ProcessHandle::destroyForcibly); process.destroyForcibly(); process.waitFor(); }
            out.join(2000); err.join(2000);
            return new CommandResult(process.exitValue(), !finished, Duration.ofNanos(System.nanoTime() - start).toMillis(),
                    stdout.toString(StandardCharsets.UTF_8), stderr.toString(StandardCharsets.UTF_8));
        } catch (IOException ex) { throw new IllegalStateException("Cannot start local command", ex);
        } catch (InterruptedException ex) { Thread.currentThread().interrupt(); throw new IllegalStateException("Command interrupted", ex); }
    }

    private void capture(InputStream input, ByteArrayOutputStream output) {
        try (input) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = input.read(buffer)) != -1)
                if (output.size() < OUTPUT_LIMIT) output.write(buffer, 0, Math.min(read, OUTPUT_LIMIT - output.size()));
        } catch (IOException ignored) { /* Process termination closes streams. */ }
    }
}
