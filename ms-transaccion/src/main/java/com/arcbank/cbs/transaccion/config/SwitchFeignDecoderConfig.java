package com.arcbank.cbs.transaccion.config;

import com.arcbank.cbs.transaccion.dto.SwitchTransferResponse;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import feign.Response;
import feign.Util;
import feign.codec.Decoder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;

import java.io.IOException;
import java.lang.reflect.Type;

@Slf4j
public class SwitchFeignDecoderConfig {

    @Bean
    public feign.RequestInterceptor requestInterceptor(
            @org.springframework.beans.factory.annotation.Value("${app.switch.apikey}") String apiKey) {
        return requestTemplate -> {
            requestTemplate.header("apikey", apiKey);
            log.debug("🔑 Añadiendo header apikey: {}", apiKey);
        };
    }

    @Bean
    public Decoder feignDecoder() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.registerModule(new JavaTimeModule());

        return new Decoder() {
            @Override
            public Object decode(Response response, Type type) throws IOException {
                if (!type.getTypeName().contains("SwitchTransferResponse")) {
                    if (response.body() == null) {
                        return null;
                    }
                    String body = Util.toString(response.body().asReader(java.nio.charset.StandardCharsets.UTF_8));
                    return mapper.readValue(body, mapper.constructType(type));
                }

                if (response.body() == null) {
                    log.info("📥 Switch response body is null, status: {}", response.status());
                    if (response.status() >= 200 && response.status() < 300) {
                        return SwitchTransferResponse.builder()
                                .success(true)
                                .build();
                    }
                    return SwitchTransferResponse.builder()
                            .success(false)
                            .error(SwitchTransferResponse.ErrorBody.builder()
                                    .code("EMPTY_RESPONSE")
                                    .message("Switch returned empty response")
                                    .build())
                            .build();
                }

                String body = Util.toString(response.body().asReader(java.nio.charset.StandardCharsets.UTF_8));
                log.info("📥 Switch raw response - Status: {}, Body: {}", response.status(), body);

                if (body == null || body.isBlank()) {
                    if (response.status() >= 200 && response.status() < 300) {
                        log.info("✅ Switch returned 2xx with empty body - treating as success");
                        return SwitchTransferResponse.builder()
                                .success(true)
                                .build();
                    }
                }

                try {
                    JsonNode rootNode = mapper.readTree(body);
                    SwitchTransferResponse switchResp = mapper.treeToValue(rootNode, SwitchTransferResponse.class);

                    if (response.status() >= 200 && response.status() < 300) {
                        if (switchResp.getError() == null || switchResp.getData() != null) {
                            log.info("✅ Switch returned 2xx - marking as success");
                            switchResp.setSuccess(true);
                        }

                        if (rootNode.has("estado")) {
                            String estado = rootNode.get("estado").asText();
                            if (estado.matches("(?i)(COMPLETADA|EXITOSA|PROCESADA|SUCCESS|OK|ACCEPTED)")) {
                                switchResp.setSuccess(true);
                            }
                        }
                        if (rootNode.has("status")) {
                            String status = rootNode.get("status").asText();
                            if (status.matches("(?i)(COMPLETED|SUCCESS|PROCESSED|ACCEPTED|OK)")) {
                                switchResp.setSuccess(true);
                            }
                        }
                        if (rootNode.has("instructionId") || rootNode.has("transactionId") || rootNode.has("id")) {
                            switchResp.setSuccess(true);
                        }
                    }

                    return switchResp;

                } catch (Exception e) {
                    log.error("Error parsing Switch response: {} - Body: {}", e.getMessage(), body);

                    if (response.status() >= 200 && response.status() < 300) {
                        log.info("✅ Switch returned 2xx but couldn't parse - treating as success");
                        return SwitchTransferResponse.builder()
                                .success(true)
                                .build();
                    }

                    return SwitchTransferResponse.builder()
                            .success(false)
                            .error(SwitchTransferResponse.ErrorBody.builder()
                                    .code("PARSE_ERROR")
                                    .message("Failed to parse: " + e.getMessage())
                                    .build())
                            .build();
                }
            }
        };
    }

    @Bean
    public feign.codec.ErrorDecoder errorDecoder() {
        return (methodKey, response) -> {
            String body = "Unknown Error";
            try {
                if (response.body() != null) {
                    body = Util.toString(response.body().asReader(java.nio.charset.StandardCharsets.UTF_8));
                }
            } catch (IOException e) {
                log.error("Error reading error response body", e);
            }
            log.error("🔥 Switch responded with error. Status: {}, Body: {}", response.status(), body);

            // Retornamos una excepción con el cuerpo del error para que el servicio lo
            // capture
            return new RuntimeException("Switch Error (" + response.status() + "): " + body);
        };
    }
}
