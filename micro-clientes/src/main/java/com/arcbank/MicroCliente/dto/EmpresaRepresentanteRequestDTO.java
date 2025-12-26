package com.arcbank.MicroCliente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EmpresaRepresentanteRequestDTO {

    @NotNull(message = "Id del representante es obligatorio")
    private Integer idRepresentante;

    @NotBlank(message = "Rol es obligatorio")
    private String rol;

    private LocalDate fechaDesignacion;
}
