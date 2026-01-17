package com.arcbank.MicroCliente.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class EmpresaRequestDTO {

    private ClienteRequestDTO cliente;

    private String razonSocial;
    private LocalDate fechaConstitucion;
    private String direccionPrincipal;

    private List<EmpresaRepresentanteRequestDTO> representantes;
}
