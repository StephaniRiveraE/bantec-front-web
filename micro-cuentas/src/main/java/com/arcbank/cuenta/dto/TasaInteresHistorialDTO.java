package com.arcbank.cuenta.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TasaInteresHistorialDTO {
    private Integer idTasaHistorial;
    private Integer idTipoCuenta;
    private BigDecimal tasaInteresAnual;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaInicio;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaFin;
}
