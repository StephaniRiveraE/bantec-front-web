package com.arcbank.cbs.transaccion.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO para enviar transferencias al Switch DIGICONECU
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwitchTransferRequest {
    
    private UUID instructionId;
    
    private String bancoOrigen;      // "BANTEC"
    
    private String cuentaOrigen;     // Número de cuenta origen (no ID interno)
    
    private String cuentaDestino;    // Número de cuenta destino (otro banco)
    
    private BigDecimal monto;
    
    private String moneda;           // "USD"
    
    private String concepto;
}
