package com.arcbank.cuenta.model;

import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "TipoCuentaAhorro", schema = "public")
@Getter
@Setter
public class TipoCuentaAhorro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdTipoCuenta")
    private Integer idTipoCuenta;

    @Column(name = "Nombre", length = 50, nullable = false, unique = true)
    private String nombre;

    @Column(name = "Descripcion", length = 255)
    private String descripcion;

    @Column(name = "TasaInteresMaxima", precision = 5, scale = 2, nullable = false)
    private java.math.BigDecimal tasaInteresMaxima;

    @Column(name = "Amortizacion", length = 20, nullable = false)
    private String amortizacion;

    @Column(name = "Activo", nullable = false)
    private Boolean activo;

    public TipoCuentaAhorro() { }

    public TipoCuentaAhorro(Integer idTipoCuenta) {
        this.idTipoCuenta = idTipoCuenta;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        TipoCuentaAhorro that = (TipoCuentaAhorro) o;
        return Objects.equals(idTipoCuenta, that.idTipoCuenta);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idTipoCuenta);
    }

    @Override
    public String toString() {
        return "TipoCuentaAhorro{" +
                "idTipoCuenta=" + idTipoCuenta +
                ", nombre='" + nombre + '\'' +
                ", descripcion='" + descripcion + '\'' +
                ", tasaInteresMaxima=" + tasaInteresMaxima +
                ", amortizacion='" + amortizacion + '\'' +
                ", activo=" + activo +
                '}';
    }
}
