package com.arcbank.cuenta.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arcbank.cuenta.model.CuentaAhorro;

public interface CuentaAhorroRepository extends JpaRepository<CuentaAhorro, Integer> {

    Optional<CuentaAhorro> findByNumeroCuenta(String numeroCuenta);

    boolean existsByNumeroCuenta(String numeroCuenta);
}
