package com.enterprise.copilot.infrastructure.ai;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Loads externalised prompt templates from {@code classpath:prompts/*.st}
 * and renders them with simple {@code {placeholder}} substitution.
 * Prompts live in resources, never as giant Java strings.
 */
@Component
public class PromptLibrary {

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public String render(String promptName, Map<String, String> vars) {

        String template = cache.computeIfAbsent(promptName, this::load);

        String out = template;

        for (Map.Entry<String, String> e : vars.entrySet()) {
            out = out.replace("{" + e.getKey() + "}", e.getValue() == null ? "" : e.getValue());
        }
        return out;
    }

    private String load(String promptName) {
        try {
            return StreamUtils.copyToString(
                    new ClassPathResource("prompts/" + promptName + ".st").getInputStream(),
                    StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Missing prompt template: " + promptName, e);
        }
    }
}
