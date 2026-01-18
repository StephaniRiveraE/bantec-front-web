package com.arcbank.cbs.transaccion.controller;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.arcbank.cbs.transaccion.dto.SwitchRefundRequest;
import com.arcbank.cbs.transaccion.dto.SwitchTransferRequest;
import com.arcbank.cbs.transaccion.service.TransaccionService;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping
@RequiredArgsConstructor
public class WebhookController {

        private final TransaccionService transaccionService;
        private final ObjectMapper mapper;

        @PostMapping("/api/core/transferencias/recepcion")
        public ResponseEntity<?> recibirWebhookUnificado(@RequestBody Map<String, Object> payload) {
                log.info("📥 Webhook Unificado recibido: {}", payload);

                try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> body = (Map<String, Object>) payload.get("body");

                        if (body == null) {
                                return ResponseEntity.badRequest()
                                                .body(Map.of("status", "NACK", "error", "Body faltante"));
                        }

                        // Detección de Tipo de Mensaje
                        if (body.containsKey("returnInstructionId") || body.containsKey("originalInstructionId")) {
                                // CASO 1: Es una DEVOLUCIÓN (pacs.004)
                                log.info("🔀 Detectado: DEVOLUCIÓN (pacs.004)");

                                SwitchRefundRequest refundRequest = mapper.convertValue(payload,
                                                SwitchRefundRequest.class);
                                transaccionService.procesarDevolucionEntrante(refundRequest);

                                return ResponseEntity.ok(Map.of("status", "ACK", "message", "Devolución procesada"));

                        } else {
                                // CASO 2: Es una TRANSFERENCIA NORMAL (pacs.008)
                                log.info("🔀 Detectado: TRANSFERENCIA (pacs.008)");

                                SwitchTransferRequest transferRequest = mapper.convertValue(payload,
                                                SwitchTransferRequest.class);

                                if (transferRequest.getBody() == null
                                                || transferRequest.getBody().getInstructionId() == null) {
                                        return ResponseEntity.badRequest().body(Map.of("status", "NACK", "error",
                                                        "Datos incompletos para transferencia"));
                                }

                                String instructionId = transferRequest.getBody().getInstructionId();
                                String cuentaDestino = transferRequest.getBody().getCreditor().getAccountId();
                                String bancoOrigen = transferRequest.getHeader().getOriginatingBankId();
                                BigDecimal monto = transferRequest.getBody().getAmount().getValue();

                                transaccionService.procesarTransferenciaEntrante(instructionId, cuentaDestino, monto,
                                                bancoOrigen);

                                return ResponseEntity.ok(Map.of(
                                                "status", "ACK",
                                                "message", "Transferencia procesada",
                                                "instructionId", instructionId));
                        }

                } catch (Exception e) {
                        log.error("❌ Error procesando webhook unificado: {}", e.getMessage());
                        return ResponseEntity.status(422).body(Map.of("status", "NACK", "error", e.getMessage()));
                }
        }
}