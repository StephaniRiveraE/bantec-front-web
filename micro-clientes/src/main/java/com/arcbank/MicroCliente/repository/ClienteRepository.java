package com.arcbank.MicroCliente.repository;

import com.arcbank.MicroCliente.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

    boolean existsByIdentificacion(String identificacion);
    Optional<Cliente> findByIdentificacion(String identificacion);
}
