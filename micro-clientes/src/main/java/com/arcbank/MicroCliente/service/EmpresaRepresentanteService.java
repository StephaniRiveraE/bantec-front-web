package com.arcbank.MicroCliente.service;


import com.arcbank.MicroCliente.dto.EmpresaRepresentanteRequestDTO;
import com.arcbank.MicroCliente.dto.EmpresaRepresentanteResponseDTO;

import java.util.List;

public interface EmpresaRepresentanteService {

    EmpresaRepresentanteResponseDTO asignarRepresentante(
            Integer idEmpresa,
            EmpresaRepresentanteRequestDTO dto
    );

    void bajaRepresentante(Integer idEmpresa);

    List<EmpresaRepresentanteResponseDTO> historial(Integer idEmpresa);
}
