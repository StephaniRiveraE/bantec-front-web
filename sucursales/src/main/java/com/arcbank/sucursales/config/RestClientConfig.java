package com.arcbank.sucursales.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient restClient(RestClient.Builder builder,
                                 @Value("${arcbank.audit.base-url:http://localhost:8081}") String baseUrl) {
        return builder
                .baseUrl(baseUrl)
                .build();
    }
}
