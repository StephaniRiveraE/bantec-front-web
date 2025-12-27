package com.arcbank.sucursales.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Ubicacion {

    private NivelUbicacion provincia;
    private NivelUbicacion canton;
    private NivelUbicacion parroquia;

    private FeriadosPorNivel feriados;

    public Ubicacion() { }

    @Override
    public String toString() {
        return "Ubicacion{" +
                "provincia=" + provincia +
                ", canton=" + canton +
                ", parroquia=" + parroquia +
                ", feriados=" + feriados +
                '}';
    }
}
