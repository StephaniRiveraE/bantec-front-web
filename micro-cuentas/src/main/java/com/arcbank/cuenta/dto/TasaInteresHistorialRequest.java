package com.arcbank.cuenta.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TasaInteresHistorialRequest {

    @NotNull(message = "El ID del tipo de cuenta es obligatorio")
    @Positive
    private Integer idTipoCuenta;

    @NotNull(message = "La tasa de interés anual es obligatoria")
    @DecimalMin(value = "0.0", message = "La tasa no puede ser negativa")
    private BigDecimal tasaInteresAnual;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    private LocalDate fechaFin;
}
