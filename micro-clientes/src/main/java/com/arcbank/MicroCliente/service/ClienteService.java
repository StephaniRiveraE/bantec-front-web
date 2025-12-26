package com.arcbank.MicroCliente.service;

import com.arcbank.MicroCliente.dto.ClienteRequestDTO;
import com.arcbank.MicroCliente.dto.ClienteResponseDTO;

public interface ClienteService {

    ClienteResponseDTO crearCliente(ClienteRequestDTO request);

    ClienteResponseDTO buscarPorId(Integer idCliente);

    ClienteResponseDTO buscarPorIdentificacion(String identificacion);

    ClienteResponseDTO actualizarEstado(Integer idCliente, String estado);

    ClienteResponseDTO login(String identificacion, String clave);
}
