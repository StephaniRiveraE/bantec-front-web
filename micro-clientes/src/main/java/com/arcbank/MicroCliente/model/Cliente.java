package com.arcbank.MicroCliente.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "cliente")
@Getter
@Setter
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idCliente;

    private String tipoCliente;
    private String tipoIdentificacion;

    @Column(unique = true)
    private String identificacion;

    private String clave; // Contraseña del cliente para banca web/cajero
    private String nombreCompleto; // Nombre completo del cliente

    private LocalDate fechaRegistro;
    private String estado;
}
