package com.arcbank.sucursales.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EntidadBancariaRequest {

    @NotBlank(message = "Nombre de entidad obligatorio")
    private String nombre;

    @NotBlank(message = "RUC obligatorio")
    @Size(min = 13, max = 13, message = "RUC debe tener 13 dígitos")
    private String ruc;

    @NotBlank(message = "Estado obligatorio")
    private String estado;
}
