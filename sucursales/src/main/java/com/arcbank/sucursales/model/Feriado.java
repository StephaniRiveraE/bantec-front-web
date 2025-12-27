package com.arcbank.sucursales.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
public class Feriado {

    private LocalDate fecha;
    private String descripcion;
    private String tipoFeriado;
    private Boolean activo;

    public Feriado() { }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Feriado feriado = (Feriado) o;
        return Objects.equals(fecha, feriado.fecha) &&
                Objects.equals(tipoFeriado, feriado.tipoFeriado);
    }

    @Override
    public int hashCode() {
        return Objects.hash(fecha, tipoFeriado);
    }

    @Override
    public String toString() {
        return "Feriado{" +
                "fecha=" + fecha +
                ", descripcion='" + descripcion + '\'' +
                ", tipoFeriado='" + tipoFeriado + '\'' +
                ", activo=" + activo +
                '}';
    }

}
