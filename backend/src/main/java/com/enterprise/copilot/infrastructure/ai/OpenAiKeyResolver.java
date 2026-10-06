package com.enterprise.copilot.infrastructure.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resolves the OpenAI key on every call so a key added to .env is picked up without a restart.
 */
@Component
public class OpenAiKeyResolver {

    private static final Pattern KEY_LINE =
            Pattern.compile("^\\s*(?:export\\s+)?OPENAI_API_KEY\\s*=\\s*(.*)$");

    private final String startupKey;
    private final List<Path> envFiles;

    public OpenAiKeyResolver(@Value("${spring.ai.openai.api-key:}") String startupKey) {
        this.startupKey = startupKey;
        Path cwd = Path.of("").toAbsolutePath();
        // Covers running from backend/ (mvnw) as well as from the project root.
        this.envFiles = cwd.getParent() == null
                ? List.of(cwd.resolve(".env"))
                : List.of(cwd.resolve(".env"), cwd.getParent().resolve(".env"));
    }

    public Optional<String> resolve() {
        for (Path file : envFiles) {
            Optional<String> key = readKey(file);
            if (key.isPresent()) {
                return key;
            }
        }
        return StringUtils.hasText(startupKey) ? Optional.of(startupKey.trim()) : Optional.empty();
    }

    private Optional<String> readKey(Path file) {
        if (!Files.isRegularFile(file)) {
            return Optional.empty();
        }
        try {
            for (String line : Files.readAllLines(file)) {
                Matcher matcher = KEY_LINE.matcher(line);
                if (matcher.matches()) {
                    String value = unquote(matcher.group(1).trim());
                    return StringUtils.hasText(value) ? Optional.of(value) : Optional.empty();
                }
            }
        } catch (IOException ex) {
            return Optional.empty();
        }
        return Optional.empty();
    }

    private static String unquote(String value) {
        if (value.length() >= 2
                && (value.startsWith("\"") && value.endsWith("\"")
                        || value.startsWith("'") && value.endsWith("'"))) {
            return value.substring(1, value.length() - 1).trim();
        }
        int comment = value.indexOf(" #");
        return comment >= 0 ? value.substring(0, comment).trim() : value;
    }
}
