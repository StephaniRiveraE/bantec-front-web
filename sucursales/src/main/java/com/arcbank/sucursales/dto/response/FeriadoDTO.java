package com.arcbank.sucursales.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class FeriadoDTO {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fecha;

    private String descripcion;
    private String tipoFeriado;
    private Boolean activo;
}
