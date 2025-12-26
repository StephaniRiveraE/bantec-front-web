package com.arcbank.MicroCliente.service.impl;

import com.arcbank.MicroCliente.dto.*;
import com.arcbank.MicroCliente.model.Cliente;
import com.arcbank.MicroCliente.model.Empresa;
import com.arcbank.MicroCliente.model.EmpresaRepresentante;
import com.arcbank.MicroCliente.repository.ClienteRepository;
import com.arcbank.MicroCliente.repository.EmpresaRepository;
import com.arcbank.MicroCliente.repository.EmpresaRepresentanteRepository;
import com.arcbank.MicroCliente.repository.PersonaRepository;
import com.arcbank.MicroCliente.service.EmpresaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmpresaServiceImpl implements EmpresaService {

    private final EmpresaRepository empresaRepository;
    private final ClienteRepository clienteRepository;
    private final EmpresaRepresentanteRepository representanteRepository;
    private final PersonaRepository personaRepository;

    public EmpresaServiceImpl(
            EmpresaRepository empresaRepository,
            ClienteRepository clienteRepository,
            EmpresaRepresentanteRepository representanteRepository,
            PersonaRepository personaRepository
    ) {
        this.empresaRepository = empresaRepository;
        this.clienteRepository = clienteRepository;
        this.representanteRepository = representanteRepository;
        this.personaRepository = personaRepository;
    }

    @Override
    public EmpresaResponseDTO crearEmpresa(EmpresaRequestDTO request) {


        Cliente cliente = new Cliente();
        cliente.setTipoCliente("E");
        cliente.setTipoIdentificacion(request.getCliente().getTipoIdentificacion());
        cliente.setIdentificacion(request.getCliente().getIdentificacion());
        cliente.setFechaRegistro(LocalDate.now());
        cliente.setEstado("ACTIVO");

        cliente = clienteRepository.save(cliente);

        Empresa empresa = new Empresa();
        empresa.setCliente(cliente);
        empresa.setRazonSocial(request.getRazonSocial());
        empresa.setFechaConstitucion(request.getFechaConstitucion());
        empresa.setDireccionPrincipal(request.getDireccionPrincipal());

        empresa = empresaRepository.save(empresa);

        return mapToDTO(empresa);
    }

    @Override
    public EmpresaResponseDTO obtenerEmpresa(Integer idCliente) {
        Empresa empresa = empresaRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        return mapToDTO(empresa);
    }

    @Override
    public List<EmpresaResponseDTO> listarEmpresas() {
        return empresaRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public EmpresaResponseDTO actualizarEmpresa(Integer idCliente, EmpresaRequestDTO request) {
        Empresa empresa = empresaRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        empresa.setRazonSocial(request.getRazonSocial());
        empresa.setFechaConstitucion(request.getFechaConstitucion());
        empresa.setDireccionPrincipal(request.getDireccionPrincipal());

        empresaRepository.save(empresa);
        return mapToDTO(empresa);
    }

    @Override
    public void bajaLogicaEmpresa(Integer idCliente) {

        Empresa empresa = empresaRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Cliente cliente = empresa.getCliente();
        cliente.setEstado("INACTIVO");

        clienteRepository.save(cliente);
    }


    private EmpresaResponseDTO mapToDTO(Empresa empresa) {
        EmpresaResponseDTO dto = new EmpresaResponseDTO();
        dto.setIdCliente(empresa.getIdCliente());
        dto.setRazonSocial(empresa.getRazonSocial());
        dto.setFechaConstitucion(empresa.getFechaConstitucion());
        dto.setDireccionPrincipal(empresa.getDireccionPrincipal());

        ClienteResponseDTO cliDTO = new ClienteResponseDTO();
        cliDTO.setIdCliente(empresa.getCliente().getIdCliente());
        cliDTO.setTipoCliente(empresa.getCliente().getTipoCliente());
        cliDTO.setTipoIdentificacion(empresa.getCliente().getTipoIdentificacion());
        cliDTO.setIdentificacion(empresa.getCliente().getIdentificacion());
        cliDTO.setFechaRegistro(empresa.getCliente().getFechaRegistro());
        cliDTO.setEstado(empresa.getCliente().getEstado());
        dto.setCliente(cliDTO);

        List<EmpresaRepresentante> reps = representanteRepository.findByEmpresa(empresa);
        List<EmpresaRepresentanteResponseDTO> repDtos = reps.stream().map(rep -> {
            EmpresaRepresentanteResponseDTO r = new EmpresaRepresentanteResponseDTO();
            r.setId(rep.getId());
            r.setIdRepresentante(rep.getRepresentante().getIdCliente());
            r.setIdEmpresa(empresa.getIdCliente());
            r.setRol(rep.getRol());
            r.setFechaDesignacion(rep.getFechaDesignacion());
            r.setFechaFinDesignacion(rep.getFechaFinDesignacion());
            r.setEstado(rep.getEstado());
            return r;
        }).collect(Collectors.toList());
        dto.setRepresentantes(repDtos);

        return dto;
    }
}
