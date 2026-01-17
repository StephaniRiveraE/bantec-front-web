package com.arcbank.cuenta.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arcbank.cuenta.model.TasaInteresHistorial;

public interface TasaInteresHistorialRepository extends JpaRepository<TasaInteresHistorial, Integer> {

    List<TasaInteresHistorial> findByTipoCuenta_IdTipoCuenta(Integer idTipoCuenta);
}
