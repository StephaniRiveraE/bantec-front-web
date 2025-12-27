package com.arcbank.api_gateway.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.cloud.gateway.route.RouteDefinition;
import org.springframework.cloud.gateway.route.RouteDefinitionLocator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuración de Swagger centralizado en API Gateway
 * Agrega automáticamente todos los microservicios registrados en las rutas
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public List<GroupedOpenApi> apis(RouteDefinitionLocator locator) {
        List<GroupedOpenApi> groups = new ArrayList<>();
        List<RouteDefinition> definitions = locator.getRouteDefinitions().collectList().block();

        if (definitions != null) {
            definitions.forEach(routeDefinition -> {
                String name = routeDefinition.getId();
                groups.add(GroupedOpenApi.builder()
                        .group(name)
                        .pathsToMatch("/" + name + "/**")
                        .build());
            });
        }

        return groups;
    }
}
