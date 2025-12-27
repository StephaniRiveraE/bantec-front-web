package com.arcbank.sucursales.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FeriadosPorNivelDTO {

    private List<FeriadoDTO> provincia;
    private List<FeriadoDTO> canton;
    private List<FeriadoDTO> parroquia;
}
