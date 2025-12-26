package com.arcbank.MicroCliente.service.impl;

import com.arcbank.MicroCliente.dto.ClienteRequestDTO;
import com.arcbank.MicroCliente.dto.ClienteResponseDTO;
import com.arcbank.MicroCliente.dto.PersonaRequestDTO;
import com.arcbank.MicroCliente.dto.PersonaResponseDTO;
import com.arcbank.MicroCliente.model.Cliente;
import com.arcbank.MicroCliente.model.Persona;
import com.arcbank.MicroCliente.repository.ClienteRepository;
import com.arcbank.MicroCliente.repository.PersonaRepository;
import com.arcbank.MicroCliente.service.PersonaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PersonaServiceImpl implements PersonaService {

    private final PersonaRepository personaRepository;
    private final ClienteRepository clienteRepository;

    public PersonaServiceImpl(PersonaRepository personaRepository,
                              ClienteRepository clienteRepository) {
        this.personaRepository = personaRepository;
        this.clienteRepository = clienteRepository;
    }

    @Override
    public PersonaResponseDTO crearPersona(PersonaRequestDTO request) {

        if (clienteRepository.existsByIdentificacion(request.getCliente().getIdentificacion())) {
            throw new RuntimeException("Error: Ya existe un cliente con la identificación " + request.getCliente().getIdentificacion());
        }

        ClienteRequestDTO c = request.getCliente();
        Cliente cliente = new Cliente();
        cliente.setTipoCliente("P");
        cliente.setTipoIdentificacion(c.getTipoIdentificacion());
        cliente.setIdentificacion(c.getIdentificacion());
        cliente.setFechaRegistro(LocalDate.now());
        cliente.setEstado("ACTIVO");


        cliente = clienteRepository.save(cliente);

        Persona persona = new Persona(cliente);
        persona.setNombres(request.getNombres());
        persona.setApellidos(request.getApellidos());
        persona.setFechaNacimiento(request.getFechaNacimiento());
        persona.setDireccionPrincipal(request.getDireccionPrincipal());

        persona = personaRepository.save(persona);

        PersonaResponseDTO dto = new PersonaResponseDTO();
        dto.setIdCliente(persona.getIdCliente());
        dto.setNombres(persona.getNombres());
        dto.setApellidos(persona.getApellidos());
        dto.setFechaNacimiento(persona.getFechaNacimiento());
        dto.setDireccionPrincipal(persona.getDireccionPrincipal());

        dto.setDireccionPrincipal(persona.getDireccionPrincipal());
        ClienteResponseDTO cr = new ClienteResponseDTO();
        cr.setIdCliente(cliente.getIdCliente());
        cr.setTipoCliente(cliente.getTipoCliente());
        cr.setTipoIdentificacion(cliente.getTipoIdentificacion());
        cr.setIdentificacion(cliente.getIdentificacion());
        cr.setFechaRegistro(cliente.getFechaRegistro());
        cr.setEstado(cliente.getEstado());

        dto.setCliente(cr);

        return dto;
    }

    @Override
    public PersonaResponseDTO obtenerPorId(Integer id) {
        Persona persona = personaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada"));

        PersonaResponseDTO dto = new PersonaResponseDTO();
        dto.setIdCliente(persona.getIdCliente());
        dto.setNombres(persona.getNombres());
        dto.setApellidos(persona.getApellidos());
        dto.setFechaNacimiento(persona.getFechaNacimiento());
        dto.setDireccionPrincipal(persona.getDireccionPrincipal());

        Cliente c = persona.getCliente();
        ClienteResponseDTO cr = new ClienteResponseDTO();
        cr.setIdCliente(c.getIdCliente());
        cr.setTipoCliente(c.getTipoCliente());
        cr.setTipoIdentificacion(c.getTipoIdentificacion());
        cr.setIdentificacion(c.getIdentificacion());
        cr.setFechaRegistro(c.getFechaRegistro());
        cr.setEstado(c.getEstado());

        dto.setCliente(cr);

        return dto;
    }

    @Override
    public List<PersonaResponseDTO> listarPersonas() {
        return personaRepository.findAll().stream().map(p -> {
            PersonaResponseDTO dto = new PersonaResponseDTO();
            dto.setIdCliente(p.getIdCliente());
            dto.setNombres(p.getNombres());
            dto.setApellidos(p.getApellidos());
            dto.setFechaNacimiento(p.getFechaNacimiento());
            dto.setDireccionPrincipal(p.getDireccionPrincipal());

            ClienteResponseDTO cr = new ClienteResponseDTO();
            cr.setIdCliente(p.getCliente().getIdCliente());
            cr.setTipoCliente(p.getCliente().getTipoCliente());
            cr.setTipoIdentificacion(p.getCliente().getTipoIdentificacion());
            cr.setIdentificacion(p.getCliente().getIdentificacion());
            cr.setFechaRegistro(p.getCliente().getFechaRegistro());
            cr.setEstado(p.getCliente().getEstado());

            dto.setCliente(cr);
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public PersonaResponseDTO actualizarPersona(Integer id, PersonaRequestDTO request) {
        Persona persona = personaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada"));

        persona.setNombres(request.getNombres());
        persona.setApellidos(request.getApellidos());
        persona.setFechaNacimiento(request.getFechaNacimiento());
        persona.setDireccionPrincipal(request.getDireccionPrincipal());

        persona = personaRepository.save(persona);
        return obtenerPorId(persona.getIdCliente());
    }

    @Override
    public void eliminarPersona(Integer id) {
        personaRepository.deleteById(id);
    }
}
