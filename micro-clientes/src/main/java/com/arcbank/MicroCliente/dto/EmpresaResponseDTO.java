package com.arcbank.MicroCliente.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class EmpresaResponseDTO {

    private Integer idCliente;

    private String razonSocial;
    private LocalDate fechaConstitucion;
    private String direccionPrincipal;

    private ClienteResponseDTO cliente;

    private List<EmpresaRepresentanteResponseDTO> representantes;
}
