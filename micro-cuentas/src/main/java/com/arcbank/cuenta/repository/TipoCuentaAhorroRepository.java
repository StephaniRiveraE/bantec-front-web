package com.arcbank.cuenta.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arcbank.cuenta.model.TipoCuentaAhorro;

import java.util.List;

public interface TipoCuentaAhorroRepository extends JpaRepository<TipoCuentaAhorro, Integer> {

    List<TipoCuentaAhorro> findByActivoTrue();
}
