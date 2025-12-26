package com.arcbank.MicroCliente.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PersonaRequestDTO {

    @NotBlank
    private String nombres;

    @NotBlank
    private String apellidos;

    @NotNull
    private LocalDate fechaNacimiento;

    @NotBlank
    private String direccionPrincipal;

    @Valid
    @NotNull
    private ClienteRequestDTO cliente;
}
