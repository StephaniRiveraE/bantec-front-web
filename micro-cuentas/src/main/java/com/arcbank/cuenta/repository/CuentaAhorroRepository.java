package com.arcbank.cuenta.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arcbank.cuenta.model.CuentaAhorro;

public interface CuentaAhorroRepository extends JpaRepository<CuentaAhorro, Integer> {
    
    // Necesario para buscar cuentas por su número (String) y no solo por ID interno
    Optional<CuentaAhorro> findByNumeroCuenta(String numeroCuenta);
    
    // Útil para validaciones antes de crear una cuenta nueva
    boolean existsByNumeroCuenta(String numeroCuenta);
}
