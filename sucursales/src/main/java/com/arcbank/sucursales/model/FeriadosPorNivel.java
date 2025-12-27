package com.arcbank.sucursales.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FeriadosPorNivel {

    private List<Feriado> provincia;
    private List<Feriado> canton;
    private List<Feriado> parroquia;

    public FeriadosPorNivel() { }

    @Override
    public String toString() {
        return "FeriadosPorNivel{" +
                "provincia=" + provincia +
                ", canton=" + canton +
                ", parroquia=" + parroquia +
                '}';
    }
}
