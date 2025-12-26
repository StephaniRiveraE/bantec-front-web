package com.arcbank.cuenta.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arcbank.cuenta.model.TasaInteresHistorial;

public interface TasaInteresHistorialRepository extends JpaRepository<TasaInteresHistorial, Integer> {
    
    // Busca las tasas navegando por la relación: Entidad Tasa -> Atributo tipoCuenta -> Atributo idTipoCuenta
    List<TasaInteresHistorial> findByTipoCuenta_IdTipoCuenta(Integer idTipoCuenta);
}
