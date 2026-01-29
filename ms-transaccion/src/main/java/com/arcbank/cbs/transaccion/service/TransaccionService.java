package com.arcbank.cbs.transaccion.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.arcbank.cbs.transaccion.dto.TransaccionRequestDTO;
import com.arcbank.cbs.transaccion.dto.TransaccionResponseDTO;
import com.arcbank.cbs.transaccion.dto.RefoundRequestDTO;

import com.arcbank.cbs.transaccion.dto.SwitchRefundRequest;

public interface TransaccionService {

        TransaccionResponseDTO crearTransaccion(TransaccionRequestDTO request);

        List<TransaccionResponseDTO> obtenerPorCuenta(Integer idCuenta);

        TransaccionResponseDTO obtenerPorId(Integer id);

        void procesarTransferenciaEntrante(String instructionId, String cuentaDestino,
                        BigDecimal monto, String bancoOrigen);

        void procesarDevolucionEntrante(SwitchRefundRequest request);

        void solicitarReverso(RefoundRequestDTO request);

        List<Map<String, String>> obtenerMotivosDevolucion();

        String consultarEstadoTransferencia(String instructionId);

        com.arcbank.cbs.transaccion.dto.AccountLookupResponse validarCuentaExterna(String targetBankId,
                        String targetAccountNumber);

        com.arcbank.cbs.transaccion.dto.AccountLookupResponse validarCuentaLocal(String numeroCuenta);

        TransaccionResponseDTO buscarPorReferencia(String referencia);
}