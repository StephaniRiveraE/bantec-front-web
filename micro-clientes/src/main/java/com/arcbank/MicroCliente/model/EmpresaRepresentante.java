package com.arcbank.MicroCliente.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;

@Entity
@Table(name = "EmpresaRepresentante")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString
public class EmpresaRepresentante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    @EqualsAndHashCode.Include
    private Integer id;


    @ManyToOne
    @JoinColumn(name = "IdRepresentante")
    private Persona representante;


    @ManyToOne
    @JoinColumn(name = "IdEmpresa")
    private Empresa empresa;

    @Column(name = "Rol", length = 50)
    private String rol;

    @Column(name = "FechaDesignacion")
    private LocalDate fechaDesignacion;

    @Column(name = "FechaFinDesignacion")
    private LocalDate fechaFinDesignacion;

    @Column(name = "Estado", length = 10)
    private String estado;

    public EmpresaRepresentante() {}

    public EmpresaRepresentante(Integer id) {
        this.id = id;
    }
}
