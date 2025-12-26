package com.arcbank.MicroCliente.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "persona")
@Getter
@Setter
public class Persona {

    @Id
    @Column(name = "id_cliente")
    private Integer idCliente;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    private String nombres;
    private String apellidos;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "direccion_principal")
    private String direccionPrincipal;

    public Persona() {}

    public Persona(Cliente cliente) {
        this.cliente = cliente;
    }
}
