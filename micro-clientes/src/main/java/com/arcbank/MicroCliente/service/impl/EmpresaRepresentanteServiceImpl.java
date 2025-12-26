package com.arcbank.MicroCliente.service.impl;

import com.arcbank.MicroCliente.dto.EmpresaRepresentanteRequestDTO;
import com.arcbank.MicroCliente.dto.EmpresaRepresentanteResponseDTO;
import com.arcbank.MicroCliente.model.Empresa;
import com.arcbank.MicroCliente.model.EmpresaRepresentante;
import com.arcbank.MicroCliente.model.Persona;
import com.arcbank.MicroCliente.repository.EmpresaRepository;
import com.arcbank.MicroCliente.repository.EmpresaRepresentanteRepository;
import com.arcbank.MicroCliente.repository.PersonaRepository;
import com.arcbank.MicroCliente.service.EmpresaRepresentanteService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;


@Service
@Transactional
public class EmpresaRepresentanteServiceImpl
        implements EmpresaRepresentanteService {

    private final EmpresaRepository empresaRepository;
    private final PersonaRepository personaRepository;
    private final EmpresaRepresentanteRepository repository;

    public EmpresaRepresentanteServiceImpl(
            EmpresaRepository empresaRepository,
            PersonaRepository personaRepository,
            EmpresaRepresentanteRepository repository) {
        this.empresaRepository = empresaRepository;
        this.personaRepository = personaRepository;
        this.repository = repository;
    }

    @Override
    public EmpresaRepresentanteResponseDTO asignarRepresentante(
            Integer idEmpresa,
            EmpresaRepresentanteRequestDTO dto) {

        Empresa empresa = empresaRepository.findById(idEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no existe"));

        Persona representante = personaRepository
                .findById(dto.getIdRepresentante())
                .orElseThrow(() -> new RuntimeException("Persona no existe"));

        repository.findByEmpresaAndEstado(empresa, "ACTIVO")
                .ifPresent(actual -> {
                    actual.setEstado("INACTIVO");
                    actual.setFechaFinDesignacion(LocalDate.now());
                    repository.save(actual);
                });

        EmpresaRepresentante nuevo = new EmpresaRepresentante();
        nuevo.setEmpresa(empresa);
        nuevo.setRepresentante(representante);
        nuevo.setRol(dto.getRol());
        nuevo.setFechaDesignacion(
                dto.getFechaDesignacion() != null
                        ? dto.getFechaDesignacion()
                        : LocalDate.now()
        );
        nuevo.setEstado("ACTIVO");

        EmpresaRepresentante guardado = repository.save(nuevo);

        return mapToResponse(guardado);
    }

    @Override
    public void bajaRepresentante(Integer idEmpresa) {

        Empresa empresa = empresaRepository.findById(idEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no existe"));

        EmpresaRepresentante actual = repository
                .findByEmpresaAndEstado(empresa, "ACTIVO")
                .orElseThrow(() ->
                        new RuntimeException("No existe representante activo"));

        actual.setEstado("INACTIVO");
        actual.setFechaFinDesignacion(LocalDate.now());

        repository.save(actual);
    }

    @Override
    public List<EmpresaRepresentanteResponseDTO> historial(Integer idEmpresa) {

        Empresa empresa = empresaRepository.findById(idEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no existe"));

        return repository.findByEmpresa(empresa)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private EmpresaRepresentanteResponseDTO mapToResponse(
            EmpresaRepresentante e) {

        EmpresaRepresentanteResponseDTO dto =
                new EmpresaRepresentanteResponseDTO();

        dto.setId(e.getId());
        dto.setIdEmpresa(e.getEmpresa().getIdCliente());
        dto.setIdRepresentante(e.getRepresentante().getIdCliente());
        dto.setRol(e.getRol());
        dto.setFechaDesignacion(e.getFechaDesignacion());
        dto.setFechaFinDesignacion(e.getFechaFinDesignacion());
        dto.setEstado(e.getEstado());

        return dto;
    }
}
