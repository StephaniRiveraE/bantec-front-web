package com.arcbank.cuenta.dto;

import java.math.BigDecimal;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO simple para recibir el nuevo saldo desde microservicios externos.
 * Evita problemas de serialización JSON con BigDecimal directo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaldoDTO {
    private BigDecimal saldo;
}
