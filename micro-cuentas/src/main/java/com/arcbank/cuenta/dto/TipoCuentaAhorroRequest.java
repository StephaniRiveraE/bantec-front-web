package com.arcbank.cuenta.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoCuentaAhorroRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String descripcion;

    @NotNull(message = "La tasa de interés máxima es obligatoria")
    @DecimalMin(value = "0.0", message = "La tasa no puede ser negativa")
    private BigDecimal tasaInteresMaxima;

    @NotBlank(message = "La amortización es obligatoria")
    private String amortizacion;

    @NotNull(message = "El estado activo es obligatorio")
    private Boolean activo;
}
