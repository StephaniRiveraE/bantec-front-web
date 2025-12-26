package com.arcbank.MicroCliente.service;

import com.arcbank.MicroCliente.dto.EmpresaRequestDTO;
import com.arcbank.MicroCliente.dto.EmpresaResponseDTO;

import java.util.List;

public interface EmpresaService {

    EmpresaResponseDTO crearEmpresa(EmpresaRequestDTO request);

    EmpresaResponseDTO obtenerEmpresa(Integer idCliente);

    List<EmpresaResponseDTO> listarEmpresas();

    EmpresaResponseDTO actualizarEmpresa(Integer idCliente, EmpresaRequestDTO request);

    void bajaLogicaEmpresa(Integer idCliente);
}
