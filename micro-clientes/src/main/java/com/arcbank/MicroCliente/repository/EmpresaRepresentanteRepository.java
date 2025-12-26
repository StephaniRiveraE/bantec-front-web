package com.arcbank.MicroCliente.repository;

import com.arcbank.MicroCliente.model.Empresa;
import com.arcbank.MicroCliente.model.EmpresaRepresentante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmpresaRepresentanteRepository
        extends JpaRepository<EmpresaRepresentante, Integer> {

    List<EmpresaRepresentante> findByEmpresa(Empresa empresa);

    Optional<EmpresaRepresentante>
    findByEmpresaAndEstado(Empresa empresa, String estado);
}

