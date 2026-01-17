package com.arcbank.cuenta.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CuentaAhorroDTO {
    private Integer idCuenta;
    private String numeroCuenta;
    private Integer idCliente;
    private Integer idSucursalApertura;
    private Integer idTipoCuenta;

    private BigDecimal saldoActual;
    private BigDecimal saldoDisponible;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaApertura;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaUltimaTransaccion;

    private String estado;
}
