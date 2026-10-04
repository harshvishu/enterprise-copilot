package com.enterprise.copilot.tools;

import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

/**
 * Small helper to load a classpath demo-data resource as text.
 */
final class ToolResources {

    private ToolResources() {}

    static String read(String path) {

        try {

            return StreamUtils.copyToString(
                    new ClassPathResource(path).getInputStream(), StandardCharsets.UTF_8);

        } catch (IOException e) {

            throw new UncheckedIOException("Missing demo-data resource: " + path, e);
        }
    }
}
