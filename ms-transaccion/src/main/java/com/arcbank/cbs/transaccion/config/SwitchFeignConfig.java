package com.arcbank.cbs.transaccion.config;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

public class SwitchFeignConfig {

    @Value("${app.switch.apikey:}")
    private String apiKey;

    @Bean
    public RequestInterceptor apiKeyInterceptor() {
        return requestTemplate -> {
            if (apiKey != null && !apiKey.isBlank()) {
                requestTemplate.header("apikey", apiKey);
            }
        };
    }
}
