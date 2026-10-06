package com.enterprise.copilot.infrastructure.config;

import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

/**
 * Validates provider selection before model creation and builds the local Ollama model.
 */
@Configuration(proxyBeanMethods = false)
public class AiConfig {

    @Bean
    static BeanFactoryPostProcessor validateAiConfiguration(Environment environment) {
        return beanFactory -> {
            int providers = 0;
            for (String profile : new String[] {"openai", "ollama", "demo"}) {
                if (environment.matchesProfiles(profile)) {
                    providers++;
                }
            }
            if (providers != 1) {
                throw new IllegalStateException(
                        "Select exactly one AI profile: openai, ollama or demo. "
                                + "Combine it with postgres when needed.");
            }
        };
    }

    @Bean
    @Profile("ollama")
    OllamaChatModel ollamaChatModel(
            @Value("${spring.ai.ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${spring.ai.ollama.chat.options.model:llama3.1}") String model) {

        OllamaApi api = OllamaApi.builder().baseUrl(baseUrl).build();

        return OllamaChatModel.builder()
                .ollamaApi(api)
                .options(OllamaChatOptions.builder().model(model).build())
                .build();
    }
}
