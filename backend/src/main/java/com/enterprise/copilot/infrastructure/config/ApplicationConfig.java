package com.enterprise.copilot.infrastructure.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enables async pipeline execution and binds {@link CopilotProperties}.
 */
@Configuration(proxyBeanMethods = false)
@EnableAsync
@EnableConfigurationProperties(CopilotProperties.class)
public class ApplicationConfig {
}