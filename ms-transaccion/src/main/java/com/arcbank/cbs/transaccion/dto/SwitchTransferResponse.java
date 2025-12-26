package com.arcbank.cbs.transaccion.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO para recibir respuestas del Switch DIGICONECU
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwitchTransferResponse {
    
    private boolean success;
    private DataBody data;
    private ErrorBody error;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataBody {
        private UUID instructionId;
        private String estado;
        private String bancoOrigen;
        private String bancoDestino;
        private BigDecimal monto;
        private LocalDateTime timestamp;
        private LocalDateTime fechaCreacion;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorBody {
        private String code;
        private String message;
    }
}
