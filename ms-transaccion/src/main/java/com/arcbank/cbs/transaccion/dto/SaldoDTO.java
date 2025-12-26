package com.arcbank.cbs.transaccion.dto;

import java.math.BigDecimal;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO para enviar saldo a micro-cuentas.
 * Resuelve el problema de serialización JSON de BigDecimal.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaldoDTO {
    private BigDecimal saldo;
}
