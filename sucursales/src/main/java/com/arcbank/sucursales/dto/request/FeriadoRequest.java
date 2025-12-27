package com.arcbank.sucursales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class FeriadoRequest {

    @NotNull(message = "Fecha obligatoria")
    private LocalDate fecha;

    @NotBlank(message = "Descripción obligatoria")
    private String descripcion;

    @NotBlank(message = "Tipo de feriado obligatorio")
    private String tipoFeriado;

    @NotNull(message = "Estado activo obligatorio")
    private Boolean activo;
}
