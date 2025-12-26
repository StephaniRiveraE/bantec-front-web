package com.arcbank.cuenta.model;

import java.time.LocalDate;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "TasaInteresHistorial", schema = "public")
@Getter
@Setter
public class TasaInteresHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdTasaHistorial")
    private Integer idTasaHistorial;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "IdTipoCuenta", nullable = false, foreignKey = @ForeignKey(name = "fk_tasa_tipo_cuenta"))
    private TipoCuentaAhorro tipoCuenta;

    @Column(name = "TasaInteresAnual", precision = 5, scale = 2, nullable = false)
    private java.math.BigDecimal tasaInteresAnual;

    @Column(name = "FechaInicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "FechaFin")
    private LocalDate fechaFin;

    public TasaInteresHistorial() { }

    public TasaInteresHistorial(Integer idTasaHistorial) {
        this.idTasaHistorial = idTasaHistorial;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        TasaInteresHistorial that = (TasaInteresHistorial) o;
        return Objects.equals(idTasaHistorial, that.idTasaHistorial);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idTasaHistorial);
    }

    @Override
    public String toString() {
        return "TasaInteresHistorial{" +
                "idTasaHistorial=" + idTasaHistorial +
                ", tipoCuentaId=" + (tipoCuenta != null ? tipoCuenta.getIdTipoCuenta() : null) +
                ", tasaInteresAnual=" + tasaInteresAnual +
                ", fechaInicio=" + fechaInicio +
                ", fechaFin=" + fechaFin +
                '}';
    }
}
