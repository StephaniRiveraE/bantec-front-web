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
                        return SwitchTransferResponse.builder()
                                .success(true)
                                .build();
                    }
                }

                try {
                    JsonNode rootNode = mapper.readTree(body);

                    // LOGIC ADDED: Handle Array Response (List of Transactions)
                    if (rootNode.isArray()) {
                        log.warn("⚠️ Switch returned an ARRAY instead of an Object. Attempting to find transaction...");

                        // Extract requested ID from URL if possible
                        String requestUrl = response.request().url();
                        String requestedId = requestUrl.substring(requestUrl.lastIndexOf('/') + 1);
                        log.info("🔍 Searching for ID: {} in the response list", requestedId);

                        for (JsonNode node : rootNode) {
                            String nodeId = "";
                            if (node.has("idInstruccion"))
                                nodeId = node.get("idInstruccion").asText();
                            else if (node.has("instructionId"))
                                nodeId = node.get("instructionId").asText();
                            else if (node.has("id"))
                                nodeId = node.get("id").asText();

                            if (nodeId.equals(requestedId)) {
                                log.info("✅ Found matching transaction in list!");
                                // Map flat JSON to our DTO structure manually
                                return mapJsonNodeToResponse(node, mapper);
                            }
                        }

                        // If not found specific, maybe it's a list with 1 item?
                        if (rootNode.size() > 0) {
                            log.warn("⚠️ Requested ID not found, using FIRST item in list as fallback.");
                            return mapJsonNodeToResponse(rootNode.get(0), mapper);
                        }

                        return SwitchTransferResponse.builder().success(false).build();
                    }

                    // Handle normal Object response (Recursive or Flat)
                    // If it matches our DTO directly
                    try {
                        SwitchTransferResponse val = mapper.treeToValue(rootNode, SwitchTransferResponse.class);
                        if (val.getData() != null || val.getError() != null) {
                            enrichSuccess(val, rootNode);
                            return val;
                        }
                    } catch (Exception ignored) {
                    }

                    // Fallback: Map flat JSON object to Response
                    return mapJsonNodeToResponse(rootNode, mapper);

                } catch (Exception e) {
                    log.error("Error parsing Switch response: {} - Body: {}", e.getMessage(), body);

                    if (response.status() >= 200 && response.status() < 300) {
                        return SwitchTransferResponse.builder().success(true).build();
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

            private void enrichSuccess(SwitchTransferResponse resp, JsonNode node) {
                if (resp.getError() == null || resp.getData() != null)
                    resp.setSuccess(true);
                if (node.has("estado") && node.get("estado").asText()
                        .matches("(?i)(COMPLETADA|EXITOSA|PROCESADA|SUCCESS|OK|COMPLETED|QUEUED|ACCEPTED)")) {
                    resp.setSuccess(true);
                }
            }

            private SwitchTransferResponse mapJsonNodeToResponse(JsonNode node, ObjectMapper mapper) {
                SwitchTransferResponse.DataBody data = new SwitchTransferResponse.DataBody();

                if (node.has("idInstruccion"))
                    data.setInstructionId(java.util.UUID.fromString(node.get("idInstruccion").asText()));
                else if (node.has("instructionId"))
                    data.setInstructionId(java.util.UUID.fromString(node.get("instructionId").asText()));

                if (node.has("estado"))
                    data.setEstado(node.get("estado").asText());
                else if (node.has("status"))
                    data.setEstado(node.get("status").asText());

                // Default success determination
                boolean success = false;
                if (data.getEstado() != null
                        && data.getEstado()
                                .matches("(?i)(COMPLETADA|EXITOSA|PROCESADA|SUCCESS|OK|COMPLETED|QUEUED|ACCEPTED)")) {
                    success = true;
                }

                return SwitchTransferResponse.builder()
                        .success(success)
                        .data(data)
                        .build();
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
