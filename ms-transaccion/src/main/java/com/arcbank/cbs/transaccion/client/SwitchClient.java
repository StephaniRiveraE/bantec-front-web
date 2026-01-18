package com.arcbank.cbs.transaccion.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.arcbank.cbs.transaccion.dto.SwitchTransferRequest;
import com.arcbank.cbs.transaccion.dto.SwitchRefundRequest;
import com.arcbank.cbs.transaccion.dto.SwitchTransferResponse;

@FeignClient(name = "digiconecu-switch", url = "${app.switch.network-url:https://switch-digiconecu.duckdns.org}", configuration = {
        com.arcbank.cbs.transaccion.config.MTLSConfig.class,
        com.arcbank.cbs.transaccion.config.SwitchFeignDecoderConfig.class })
public interface SwitchClient {

    @PostMapping("/api/v2/switch/transfers")
    SwitchTransferResponse enviarTransferencia(@RequestBody SwitchTransferRequest request);

    @GetMapping("/api/v1/red/bancos")
    List<Map<String, Object>> obtenerBancos();

    @GetMapping("/api/v2/transfers/health")
    Map<String, String> healthCheck();

    @PostMapping("/api/v2/switch/transfers/return")
    SwitchTransferResponse solicitarDevolucion(@RequestBody SwitchRefundRequest request);
}
