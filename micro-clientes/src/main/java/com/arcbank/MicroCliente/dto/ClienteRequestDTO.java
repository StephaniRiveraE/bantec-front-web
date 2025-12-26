package com.arcbank.MicroCliente.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClienteRequestDTO {

    @NotBlank(message = "Tipo de cliente es obligatorio")
    private String tipoCliente;

    @NotBlank(message = "Tipo de identificación es obligatorio")
    private String tipoIdentificacion;

    @NotBlank(message = "Identificación es obligatoria")
    private String identificacion;
}
