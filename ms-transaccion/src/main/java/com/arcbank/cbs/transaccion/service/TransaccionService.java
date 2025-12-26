package com.arcbank.cbs.transaccion.service;

import java.math.BigDecimal;
import java.util.List;

import com.arcbank.cbs.transaccion.dto.TransaccionRequestDTO;
import com.arcbank.cbs.transaccion.dto.TransaccionResponseDTO;

public interface TransaccionService {

    /**
     * Procesa una nueva transacción financiera (Depósito, Retiro, Transferencia).
     * Valida saldos y actualiza cuentas remotas.
     */
    TransaccionResponseDTO crearTransaccion(TransaccionRequestDTO request);

    /**
     * Obtiene el historial de transacciones donde la cuenta participó
     * como Origen O como Destino.
     */
    List<TransaccionResponseDTO> obtenerPorCuenta(Integer idCuenta);

    /**
     * Busca una transacción específica por su ID (Para ver recibos/detalles).
     */
    TransaccionResponseDTO obtenerPorId(Integer id);

    /**
     * Procesa una transferencia entrante desde el switch interbancario.
     * Se llama desde el WebhookController cuando otro banco envía dinero a BANTEC.
     * 
     * @param instructionId ID único de la transacción en el switch
     * @param cuentaDestino Número de cuenta BANTEC que recibirá el dinero
     * @param monto         Cantidad a acreditar
     * @param bancoOrigen   Código del banco que envía el dinero
     */
    void procesarTransferenciaEntrante(String instructionId, String cuentaDestino,
            BigDecimal monto, String bancoOrigen);
}