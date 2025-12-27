package com.arcbank.sucursales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FeriadosPorNivelRequest {

    @NotNull
    @Valid
    private List<FeriadoRequest> provincia;

    @NotNull
    @Valid
    private List<FeriadoRequest> canton;

    @NotNull
    @Valid
    private List<FeriadoRequest> parroquia;
}
