package com.enterprise.copilot.infrastructure.config;

import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Builds the local Ollama {@code ChatModel} for the {@code ollama} profile (key-free LIVE mode).
 *
 * <p>The {@code azure} profile does not use this class: adding the
 * {@code spring-ai-starter-model-azure-openai} dependency contributes an autoconfigured
 * {@code ChatModel} bean that {@code SpringAiAgentAiClient} consumes unchanged. See docs/spring-ai.md.
 */
@Configuration(proxyBeanMethods = false)
@Profile("ollama")
public class AiConfig {

    @Bean
    OllamaChatModel ollamaChatModel(

            @Value("${spring.ai.ollama.base-url:http://localhost:11434}")
            String baseUrl,

            @Value("${spring.ai.ollama.chat.options.model:llama3.1}")
            String model) {

        OllamaApi api =
                OllamaApi.builder()
                        .baseUrl(baseUrl)
                        .build();

        return OllamaChatModel.builder()
                .ollamaApi(api)
                .options(
                        OllamaChatOptions.builder()
                                .model(model)
                                .build())
                .build();
    }
}