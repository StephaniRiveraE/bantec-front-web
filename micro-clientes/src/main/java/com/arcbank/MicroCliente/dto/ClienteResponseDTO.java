package com.arcbank.MicroCliente.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ClienteResponseDTO {
    private Integer idCliente;
    private String tipoCliente;
    private String tipoIdentificacion;
    private String identificacion;
    private String nombreCompleto;
    private LocalDate fechaRegistro;
    private String estado;
}
