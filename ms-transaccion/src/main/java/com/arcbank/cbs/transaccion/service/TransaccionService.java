package com.arcbank.cbs.transaccion.service;

import java.math.BigDecimal;
import java.util.List;

import com.arcbank.cbs.transaccion.dto.TransaccionRequestDTO;
import com.arcbank.cbs.transaccion.dto.TransaccionResponseDTO;
import com.arcbank.cbs.transaccion.dto.RefoundRequestDTO;

public interface TransaccionService {

    TransaccionResponseDTO crearTransaccion(TransaccionRequestDTO request);

    List<TransaccionResponseDTO> obtenerPorCuenta(Integer idCuenta);

    TransaccionResponseDTO obtenerPorId(Integer id);

    void procesarTransferenciaEntrante(String instructionId, String cuentaDestino,
            BigDecimal monto, String bancoOrigen);

    void solicitarReverso(RefoundRequestDTO request);
}