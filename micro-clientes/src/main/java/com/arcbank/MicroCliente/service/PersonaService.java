package com.arcbank.MicroCliente.service;

import com.arcbank.MicroCliente.dto.PersonaRequestDTO;
import com.arcbank.MicroCliente.dto.PersonaResponseDTO;

import java.util.List;

public interface PersonaService {

    PersonaResponseDTO crearPersona(PersonaRequestDTO request);

    PersonaResponseDTO obtenerPorId(Integer id);

    List<PersonaResponseDTO> listarPersonas();

    PersonaResponseDTO actualizarPersona(Integer id, PersonaRequestDTO request);

    void eliminarPersona(Integer id);
}
