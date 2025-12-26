package com.arcbank.MicroCliente.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EmpresaRepresentanteResponseDTO {

    private Integer id;
    private Integer idRepresentante;
    private Integer idEmpresa;

    private String rol;
    private LocalDate fechaDesignacion;
    private LocalDate fechaFinDesignacion;
    private String estado;
}
