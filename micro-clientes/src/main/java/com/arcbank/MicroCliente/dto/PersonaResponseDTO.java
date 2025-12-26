package com.arcbank.MicroCliente.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PersonaResponseDTO {

    private Integer idCliente;
    private String nombres;
    private String apellidos;
    private LocalDate fechaNacimiento;
    private String direccionPrincipal;

    private ClienteResponseDTO cliente;
}
