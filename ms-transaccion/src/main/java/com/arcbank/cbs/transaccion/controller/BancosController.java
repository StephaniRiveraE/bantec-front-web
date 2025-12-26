package com.arcbank.cbs.transaccion.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.arcbank.cbs.transaccion.client.SwitchClient;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Proxy controller para obtener la lista de bancos conectados al switch
 * El frontend llama a este endpoint para mostrar los bancos disponibles
 * para transferencias interbancarias
 */
@Slf4j
@RestController
@RequestMapping("/api/bancos")
@RequiredArgsConstructor
@Tag(name = "Bancos", description = "Consulta de bancos conectados al switch interbancario")
public class BancosController {

    private final SwitchClient switchClient;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.switch.network-url:http://network-management:8082}")
    private String networkManagementUrl;

    /**
     * Lista los bancos conectados al switch DIGICONECU
     * Filtra el banco propio (BANTEC) ya que no se puede transferir a sí mismo
     */
    @GetMapping
    @Operation(summary = "Listar bancos disponibles para transferencias interbancarias")
    public ResponseEntity<?> listarBancos() {
        try {
            log.info("Consultando bancos del switch DIGICONECU en: {}", networkManagementUrl);

            // Llamar directamente a network-management para obtener la lista de bancos
            String url = networkManagementUrl + "/api/v1/red/bancos";
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    });

            List<Map<String, Object>> bancos = response.getBody();
            if (bancos == null) {
                bancos = List.of();
            }

            // Filtrar el banco propio (BANTEC no puede transferir a sí mismo)
            List<Map<String, Object>> bancosExternos = bancos.stream()
                    .filter(b -> !"BANTEC".equals(b.get("codigo")))
                    .toList();

            log.info("Bancos disponibles para transferencia: {}", bancosExternos.size());

            return ResponseEntity.ok(Map.of(
                    "bancos", bancosExternos,
                    "total", bancosExternos.size()));

        } catch (Exception e) {
            log.error("Error consultando bancos del switch: {}", e.getMessage());

            // Retornar lista vacía si el switch no está disponible
            return ResponseEntity.ok(Map.of(
                    "bancos", List.of(),
                    "total", 0,
                    "error", "No se pudo conectar al switch interbancario"));
        }
    }

    /**
     * Health check de la conexión con el switch
     */
    @GetMapping("/health")
    @Operation(summary = "Verificar conexión con el switch interbancario")
    public ResponseEntity<?> healthCheck() {
        try {
            Map<String, String> health = switchClient.healthCheck();
            return ResponseEntity.ok(Map.of(
                    "status", "UP",
                    "switch", health));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "status", "DOWN",
                    "error", e.getMessage()));
        }
    }
}
