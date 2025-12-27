package com.arcbank.sucursales.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NivelUbicacionRequest {

    @NotBlank(message = "Nombre obligatorio")
    private String nombre;

    private String codigo;
}
