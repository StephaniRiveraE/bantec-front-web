package com.arcbank.cbs.transaccion.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.arcbank.cbs.transaccion.dto.SwitchTransferRequest;
import com.arcbank.cbs.transaccion.dto.SwitchTransferResponse;

/**
 * Cliente Feign para comunicación con el Switch DIGICONECU
 * 
 * URL configurable via: app.switch.url (default: http://localhost:8081)
 */
@FeignClient(name = "digiconecu-switch", url = "${app.switch.url:http://localhost:8081}")
public interface SwitchClient {

    /**
     * Enviar una transferencia interbancaria al switch
     * POST /api/v2/transfers
     */
    @PostMapping("/api/v2/transfers")
    SwitchTransferResponse enviarTransferencia(@RequestBody SwitchTransferRequest request);

    /**
     * Consultar el estado de una transferencia
     * GET /api/v2/transfers/{instructionId}
     */
    @GetMapping("/api/v2/transfers/{instructionId}")
    SwitchTransferResponse consultarEstado(@PathVariable("instructionId") String instructionId);

    /**
     * Obtener lista de bancos conectados al switch
     * GET /api/v1/red/bancos
     */
    @GetMapping("/api/v1/red/bancos")
    List<Map<String, Object>> obtenerBancos();

    /**
     * Health check del switch
     * GET /api/v2/transfers/health
     */
    @GetMapping("/api/v2/transfers/health")
    Map<String, String> healthCheck();
}
