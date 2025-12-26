package com.arcbank.MicroCliente.service.impl;

import com.arcbank.MicroCliente.dto.ClienteRequestDTO;
import com.arcbank.MicroCliente.dto.ClienteResponseDTO;
import com.arcbank.MicroCliente.model.Cliente;
import com.arcbank.MicroCliente.repository.ClienteRepository;
import com.arcbank.MicroCliente.service.ClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository clienteRepository;

    @Override
    public ClienteResponseDTO crearCliente(ClienteRequestDTO request) {
        Cliente cliente = new Cliente();
        cliente.setTipoCliente(request.getTipoCliente());
        cliente.setTipoIdentificacion(request.getTipoIdentificacion());
        cliente.setIdentificacion(request.getIdentificacion());
        cliente.setFechaRegistro(LocalDate.now());
        cliente.setEstado("ACTIVO"); // Valor inicial correcto

        Cliente guardado = clienteRepository.save(cliente);
        return toDTO(guardado);
    }

    @Override
    public ClienteResponseDTO buscarPorId(Integer idCliente) {
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return toDTO(cliente);
    }

    @Override
    public ClienteResponseDTO buscarPorIdentificacion(String identificacion) {
        Cliente cliente = clienteRepository.findByIdentificacion(identificacion)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return toDTO(cliente);
    }

    @Override
    public ClienteResponseDTO actualizarEstado(Integer idCliente, String estado) {
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        cliente.setEstado(estado);
        clienteRepository.save(cliente);

        return toDTO(cliente);
    }

    @Override
    public ClienteResponseDTO login(String identificacion, String clave) {
        Cliente cliente = clienteRepository.findByIdentificacion(identificacion)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        // Validar contraseña
        if (cliente.getClave() == null || !cliente.getClave().equals(clave)) {
            throw new RuntimeException("Contraseña incorrecta");
        }

        // Validar estado activo
        if (!"ACTIVO".equals(cliente.getEstado())) {
            throw new RuntimeException("Cliente no activo");
        }

        return toDTO(cliente);
    }

    private ClienteResponseDTO toDTO(Cliente entity) {
        ClienteResponseDTO dto = new ClienteResponseDTO();
        dto.setIdCliente(entity.getIdCliente()); // ahora Integer
        dto.setTipoCliente(entity.getTipoCliente());
        dto.setTipoIdentificacion(entity.getTipoIdentificacion());
        dto.setIdentificacion(entity.getIdentificacion());
        dto.setNombreCompleto(entity.getNombreCompleto());
        dto.setFechaRegistro(entity.getFechaRegistro());
        dto.setEstado(entity.getEstado());
        return dto;
    }
}
