package com.arcbank.cbs.transaccion.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "\"Transaccion\"", schema = "public")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"IdTransaccion\"")
    private Integer idTransaccion;

    @Column(name = "\"Referencia\"", unique = true, length = 50)
    private String referencia;

    @Column(name = "\"IdTransaccionReversa\"")
    private Integer idTransaccionReversa;

    // Valores permitidos por tu CHECK: DEPOSITO, RETIRO, TRANSFERENCIA_INTERNA,
    // ETC.
    @Column(name = "\"TipoOperacion\"", nullable = false, length = 30)
    private String tipoOperacion;

    @Column(name = "\"IdCuentaOrigen\"")
    private Integer idCuentaOrigen;

    @Column(name = "\"IdCuentaDestino\"")
    private Integer idCuentaDestino;

    @Column(name = "\"CuentaExterna\"", length = 50)
    private String cuentaExterna;

    @Column(name = "\"IdBancoExterno\"")
    private Integer idBancoExterno;

    @Column(name = "\"Monto\"", nullable = false, precision = 15, scale = 2)
    private BigDecimal monto;

    @Column(name = "\"SaldoResultante\"", precision = 15, scale = 2)
    private BigDecimal saldoResultante;

    @Column(name = "\"SaldoResultanteDestino\"", precision = 15, scale = 2)
    private BigDecimal saldoResultanteDestino;

    @Column(name = "\"FechaCreacion\"", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "\"Descripcion\"")
    private String descripcion;

    @Column(name = "\"Canal\"", length = 20)
    private String canal;

    @Column(name = "\"IdSucursal\"")
    private Integer idSucursal;

    @Column(name = "\"Estado\"", nullable = false, length = 20)
    private String estado;

    // Establece valores por defecto antes de insertar
    @PrePersist
    public void prePersist() {
        if (this.estado == null)
            this.estado = "PENDIENTE";
        if (this.canal == null)
            this.canal = "WEB";
        if (this.fechaCreacion == null)
            this.fechaCreacion = LocalDateTime.now();
    }
}