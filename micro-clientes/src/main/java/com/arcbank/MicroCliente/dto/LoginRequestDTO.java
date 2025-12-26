package com.arcbank.MicroCliente.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDTO {

    @NotBlank(message = "Identificación es obligatoria")
    private String identificacion;

    @NotBlank(message = "Contraseña es obligatoria")
    private String clave;
}
