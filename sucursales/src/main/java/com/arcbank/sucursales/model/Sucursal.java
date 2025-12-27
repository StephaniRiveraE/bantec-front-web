package com.arcbank.sucursales.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Objects;

@Document(collection = "sucursales")
@Getter
@Setter
public class Sucursal {

    @Id
    private String idSucursal;

    private String codigoUnico;
    private String nombre;
    private String direccion;
    private String telefono;

    private Double latitud;
    private Double longitud;

    private String estado;
    private LocalDate fechaApertura;


    private EntidadBancaria entidadBancaria;
    private Ubicacion ubicacion;


    public Sucursal() { }


    public Sucursal(String idSucursal) {
        this.idSucursal = idSucursal;
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Sucursal sucursal = (Sucursal) o;
        return Objects.equals(idSucursal, sucursal.idSucursal);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idSucursal);
    }

    @Override
    public String toString() {
        return "Sucursal{" +
                "idSucursal='" + idSucursal + '\'' +
                ", codigoUnico='" + codigoUnico + '\'' +
                ", nombre='" + nombre + '\'' +
                ", direccion='" + direccion + '\'' +
                ", telefono='" + telefono + '\'' +
                ", latitud=" + latitud +
                ", longitud=" + longitud +
                ", estado='" + estado + '\'' +
                ", fechaApertura=" + fechaApertura +
                ", entidadBancaria=" + entidadBancaria +
                ", ubicacion=" + ubicacion +
                '}';
    }
}
