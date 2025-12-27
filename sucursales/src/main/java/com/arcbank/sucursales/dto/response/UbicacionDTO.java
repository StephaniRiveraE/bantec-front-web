package com.arcbank.sucursales.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UbicacionDTO {

    private NivelUbicacionDTO provincia;
    private NivelUbicacionDTO canton;
    private NivelUbicacionDTO parroquia;

    private FeriadosPorNivelDTO feriados;
}
