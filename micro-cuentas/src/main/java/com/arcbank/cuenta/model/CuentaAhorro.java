package com.arcbank.cuenta.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "CuentaAhorro", schema = "public")
@Getter
@Setter
public class CuentaAhorro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdCuenta")
    private Integer idCuenta;

    @Column(name = "NumeroCuenta", length = 20, nullable = false, unique = true)
    private String numeroCuenta;

    @Column(name = "IdCliente", nullable = false)
    private Integer idCliente;

    @Column(name = "IdSucursalApertura", nullable = false)
    private Integer idSucursalApertura;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "IdTipoCuenta", nullable = false, foreignKey = @ForeignKey(name = "fk_cuenta_tipo"))
    private TipoCuentaAhorro tipoCuenta;

    @Column(name = "SaldoActual", precision = 15, scale = 2, nullable = false)
    private java.math.BigDecimal saldoActual;

    @Column(name = "SaldoDisponible", precision = 15, scale = 2, nullable = false)
    private java.math.BigDecimal saldoDisponible;

    @Column(name = "FechaApertura", nullable = false)
    private LocalDate fechaApertura;

    @Column(name = "FechaUltimaTransaccion")
    private LocalDateTime fechaUltimaTransaccion;

    @Column(name = "Estado", length = 10, nullable = false)
    private String estado;

    public CuentaAhorro() { }

    public CuentaAhorro(Integer idCuenta) {
        this.idCuenta = idCuenta;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        CuentaAhorro that = (CuentaAhorro) o;
        return Objects.equals(idCuenta, that.idCuenta);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idCuenta);
    }

    @Override
    public String toString() {
        return "CuentaAhorro{" +
                "idCuenta=" + idCuenta +
                ", numeroCuenta='" + numeroCuenta + '\'' +
                ", idCliente=" + idCliente +
                ", idSucursalApertura=" + idSucursalApertura +
                ", tipoCuentaId=" + (tipoCuenta != null ? tipoCuenta.getIdTipoCuenta() : null) +
                ", saldoActual=" + saldoActual +
                ", saldoDisponible=" + saldoDisponible +
                ", fechaApertura=" + fechaApertura +
                ", fechaUltimaTransaccion=" + fechaUltimaTransaccion +
                ", estado='" + estado + '\'' +
                '}';
    }
}
