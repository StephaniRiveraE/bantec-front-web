package com.arcbank.cuenta.dto;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoCuentaAhorroDTO {
    private Integer idTipoCuenta;
    private String nombre;
    private String descripcion;
    private BigDecimal tasaInteresMaxima;
    private String amortizacion;
    private Boolean activo;
}
