package com.enterprise.copilot.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI metadata for the Swagger UI.
 */
@Configuration(proxyBeanMethods = false)
public class OpenApiConfig {

    @Bean
    OpenAPI enterpriseCopilotOpenApi() {

        return new OpenAPI()
                .info(
                        new Info()
                                .title("Enterprise Copilot API")
                                .version("1.0.0")
                                .description(
                                        "Multi-agent SDLC platform – AI accelerates delivery, humans own accountability."
                                )
                );
    }
}