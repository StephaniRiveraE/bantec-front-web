package com.arcbank.sucursales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UbicacionRequest {

    @NotNull
    @Valid
    private NivelUbicacionRequest provincia;

    @NotNull
    @Valid
    private NivelUbicacionRequest canton;

    @NotNull
    @Valid
    private NivelUbicacionRequest parroquia;

    @NotNull
    @Valid
    private FeriadosPorNivelRequest feriados;
}
