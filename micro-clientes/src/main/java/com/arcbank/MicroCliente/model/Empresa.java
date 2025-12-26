package com.arcbank.MicroCliente.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;

@Entity
@Table(name = "empresa")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = "cliente")
public class Empresa {

    @Id
    @Column(name = "id_cliente", nullable = false)
    @EqualsAndHashCode.Include
    private Integer idCliente;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "id_cliente", referencedColumnName = "id_cliente")
    private Cliente cliente;

    @Column(name = "razon_social", length = 150, nullable = false)
    private String razonSocial;

    @Column(name = "fecha_constitucion")
    private LocalDate fechaConstitucion;

    @Column(name = "direccion_principal", length = 255)
    private String direccionPrincipal;

    public Empresa() {}

    public Empresa(Integer idCliente) {
        this.idCliente = idCliente;
    }
}
