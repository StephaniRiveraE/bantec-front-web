package com.arcbank.sucursales.model;

import lombok.Getter;
import lombok.Setter;

import java.util.Objects;

@Getter
@Setter
public class EntidadBancaria {

    private String nombre;
    private String ruc;
    private String estado;

    public EntidadBancaria() { }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EntidadBancaria that = (EntidadBancaria) o;
        return Objects.equals(ruc, that.ruc);
    }

    @Override
    public int hashCode() {
        return Objects.hash(ruc);
    }

    @Override
    public String toString() {
        return "EntidadBancaria{" +
                "nombre='" + nombre + '\'' +
                ", ruc='" + ruc + '\'' +
                ", estado='" + estado + '\'' +
                '}';
    }
}
