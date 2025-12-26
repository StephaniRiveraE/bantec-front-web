package com.arcbank.cuenta.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arcbank.cuenta.model.TipoCuentaAhorro;

import java.util.List;

public interface TipoCuentaAhorroRepository extends JpaRepository<TipoCuentaAhorro, Integer> {
    
    // Para listar en el combo del frontend solo los tipos que están "Activos"
    List<TipoCuentaAhorro> findByActivoTrue();
}
