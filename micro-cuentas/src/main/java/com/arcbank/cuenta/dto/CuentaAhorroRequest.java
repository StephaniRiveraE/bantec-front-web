package com.arcbank.cuenta.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CuentaAhorroRequest {

    @NotBlank(message = "Número de cuenta obligatorio")
    @Size(min = 10, max = 20, message = "El número de cuenta debe tener entre 10 y 20 caracteres")
    private String numeroCuenta;

    @NotNull
    @Positive(message = "ID Cliente debe ser positivo")
    private Integer idCliente;

    @NotNull
    @Positive(message = "ID Sucursal debe ser positivo")
    private Integer idSucursalApertura;

    @NotNull
    @Positive(message = "ID TipoCuenta debe ser positivo")
    private Integer idTipoCuenta;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true, message = "El saldo inicial no puede ser negativo")
    private BigDecimal saldoInicial;
}
