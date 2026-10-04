package com.enterprise.copilot.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Boot 4 / Framework 7 autoconfigure a Jackson 3 ({@code tools.jackson}) ObjectMapper for the
 * web layer. This bean provides a Jackson 2 ({@code com.fasterxml}) ObjectMapper for internal use
 * (SSE payloads and JSON columns), with the JSR-310 time module discovered via ServiceLoader.
 */
@Configuration(proxyBeanMethods = false)
public class JacksonConfig {

    @Bean
    ObjectMapper objectMapper() {

        return JsonMapper.builder()
                .findAndAddModules()
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();
    }
}
