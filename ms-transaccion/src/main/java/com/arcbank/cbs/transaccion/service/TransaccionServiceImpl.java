package com.arcbank.cbs.transaccion.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.arcbank.cbs.transaccion.client.CuentaCliente;
import com.arcbank.cbs.transaccion.client.SwitchClient;
import com.arcbank.cbs.transaccion.client.ClienteClient;
import com.arcbank.cbs.transaccion.dto.SaldoDTO;
import com.arcbank.cbs.transaccion.dto.RefoundRequestDTO;
import com.arcbank.cbs.transaccion.dto.SwitchRefundRequest;
import com.arcbank.cbs.transaccion.dto.SwitchTransferRequest;
import com.arcbank.cbs.transaccion.dto.SwitchTransferResponse;
import com.arcbank.cbs.transaccion.dto.TransaccionRequestDTO;
import com.arcbank.cbs.transaccion.dto.TransaccionResponseDTO;
import com.arcbank.cbs.transaccion.exception.BusinessException;
import com.arcbank.cbs.transaccion.model.Transaccion;
import com.arcbank.cbs.transaccion.repository.TransaccionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransaccionServiceImpl implements TransaccionService {

    private final TransaccionRepository transaccionRepository;
    private final CuentaCliente cuentaCliente;
    private final SwitchClient switchClient;
    private final ClienteClient clienteClient;

    @Value("${app.banco.codigo:BANTEC}")
    private String codigoBanco;

    @Override
    @Transactional
    public TransaccionResponseDTO crearTransaccion(TransaccionRequestDTO request) {
        log.info("Iniciando transacción Tipo: {} | Ref: {}", request.getTipoOperacion(), request.getReferencia());

        if (request.getReferencia() != null) {
            var existingTx = transaccionRepository.findByReferencia(request.getReferencia());
            if (existingTx.isPresent()) {
                log.warn("⚠️ Transacción duplicada detectada (Ref: {}). Retornando existente.",
                        request.getReferencia());
                return mapearADTO(existingTx.get(), null);
            }
        }

        String tipoOp = request.getTipoOperacion().toUpperCase();

        Transaccion trx = Transaccion.builder()
                .referencia(request.getReferencia() != null ? request.getReferencia() : UUID.randomUUID().toString())
                .tipoOperacion(tipoOp)
                .monto(request.getMonto())
                .descripcion(request.getDescripcion())
                .canal(request.getCanal() != null ? request.getCanal() : "WEB")
                .idSucursal(request.getIdSucursal())
                .cuentaExterna(request.getCuentaExterna())
                .idBancoExterno(request.getIdBancoExterno())
                .idTransaccionReversa(request.getIdTransaccionReversa())
                .estado("PENDIENTE")
                .build();

        BigDecimal saldoImpactado = null;

        try {
            switch (tipoOp) {
                case "DEPOSITO" -> {
                    if (request.getIdCuentaDestino() == null)
                        throw new BusinessException("El DEPOSITO requiere una cuenta destino obligatoria.");
                    trx.setIdCuentaDestino(request.getIdCuentaDestino());
                    trx.setIdCuentaOrigen(null);
                    saldoImpactado = procesarSaldo(trx.getIdCuentaDestino(), request.getMonto());
                }

                case "RETIRO" -> {
                    if (request.getIdCuentaOrigen() == null)
                        throw new BusinessException("El RETIRO requiere una cuenta origen obligatoria.");
                    trx.setIdCuentaOrigen(request.getIdCuentaOrigen());
                    trx.setIdCuentaDestino(null);
                    saldoImpactado = procesarSaldo(trx.getIdCuentaOrigen(), request.getMonto().negate());
                }

                case "TRANSFERENCIA_INTERNA" -> {
                    if (request.getIdCuentaOrigen() == null || request.getIdCuentaDestino() == null) {
                        throw new BusinessException(
                                "La TRANSFERENCIA INTERNA requiere cuenta origen y cuenta destino.");
                    }
                    if (request.getIdCuentaOrigen().equals(request.getIdCuentaDestino())) {
                        throw new BusinessException("No se puede transferir a la misma cuenta.");
                    }
                    trx.setIdCuentaOrigen(request.getIdCuentaOrigen());
                    trx.setIdCuentaDestino(request.getIdCuentaDestino());

                    BigDecimal saldoOrigen = procesarSaldo(trx.getIdCuentaOrigen(), request.getMonto().negate());
                    BigDecimal saldoDestino = procesarSaldo(trx.getIdCuentaDestino(), request.getMonto());

                    trx.setSaldoResultanteDestino(saldoDestino);
                    saldoImpactado = saldoOrigen;
                }

                case "TRANSFERENCIA_SALIDA" -> {
                    if (request.getIdCuentaOrigen() == null)
                        throw new BusinessException("Falta cuenta origen para transferencia externa.");
                    if (request.getCuentaExterna() == null || request.getCuentaExterna().isBlank())
                        throw new BusinessException("Falta cuenta destino externa para transferencia interbancaria.");

                    BigDecimal montoTotal = request.getMonto();

                    trx.setIdCuentaOrigen(request.getIdCuentaOrigen());
                    trx.setIdCuentaDestino(null);
                    trx.setCuentaExterna(request.getCuentaExterna());
                    trx.setIdBancoExterno(request.getIdBancoExterno());
                    trx.setMonto(montoTotal);
                    trx.setDescripcion(request.getDescripcion());

                    BigDecimal saldoDebitado = null;
                    try {
                        saldoDebitado = procesarSaldo(trx.getIdCuentaOrigen(), montoTotal.negate());
                    } catch (Exception e) {
                        log.error("Error al debitar saldo (con comisión): {}", e.getMessage());
                        throw new BusinessException("Error al debitar cuenta origen: " + e.getMessage());
                    }

                    String numeroCuentaOrigen = obtenerNumeroCuenta(request.getIdCuentaOrigen());
                    String nombreDebtor = "Cliente Bantec";
                    String tipoCuentaDebtor = "SAVINGS";

                    try {
                        Map<String, Object> cuentaInfo = cuentaCliente.obtenerCuenta(request.getIdCuentaOrigen());
                        if (cuentaInfo != null && cuentaInfo.get("idCliente") != null) {
                            Integer idCliente = (Integer) cuentaInfo.get("idCliente");
                            Map<String, Object> clienteInfo = clienteClient.obtenerCliente(idCliente);
                            if (clienteInfo != null && clienteInfo.get("nombre") != null) {
                                nombreDebtor = clienteInfo.get("nombre").toString();
                            }
                        }
                    } catch (Exception e) {
                        log.warn("No se pudo obtener detalle completo del cliente/cuenta: {}", e.getMessage());
                    }

                    try {
                        log.info("🚀 [BANTEC] Iniciando transferencia al switch: {} -> {}", numeroCuentaOrigen,
                                request.getCuentaExterna());

                        String messageId = "MSG-BANTEC-" + System.currentTimeMillis();
                        String creationTime = java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC)
                                .format(java.time.format.DateTimeFormatter.ISO_INSTANT);

                        String beneficiario = request.getBeneficiario() != null ? request.getBeneficiario()
                                : "Beneficiario Externo";

                        SwitchTransferRequest switchRequest = SwitchTransferRequest.builder()
                                .header(SwitchTransferRequest.Header.builder()
                                        .messageId(messageId)
                                        .creationDateTime(creationTime)
                                        .originatingBankId(codigoBanco)
                                        .build())
                                .body(SwitchTransferRequest.Body.builder()
                                        .instructionId(trx.getReferencia())
                                        .endToEndId("REF-BANTEC-" + trx.getReferencia())
                                        .amount(SwitchTransferRequest.Amount.builder()
                                                .currency("USD")
                                                .value(request.getMonto())
                                                .build())
                                        .debtor(SwitchTransferRequest.Party.builder()
                                                .name(nombreDebtor)
                                                .accountId(numeroCuentaOrigen)
                                                .accountType(tipoCuentaDebtor)
                                                .bankId(codigoBanco)
                                                .build())
                                        .creditor(SwitchTransferRequest.Party.builder()
                                                .name(beneficiario)
                                                .accountId(request.getCuentaExterna())
                                                .accountType("SAVINGS")
                                                .targetBankId(request.getIdBancoExterno() != null
                                                        ? request.getIdBancoExterno()
                                                        : "UNKNOWN")
                                                .build())
                                        .remittanceInformation(request.getDescripcion() != null
                                                ? request.getDescripcion()
                                                : "Transferencia interbancaria BANTEC")
                                        .build())
                                .build();

                        log.info("📤 Enviando a Switch DIGICONECU: Debtor={} Creditor={} Monto={}",
                                nombreDebtor, beneficiario, request.getMonto());

                        SwitchTransferResponse switchResp = switchClient.enviarTransferencia(switchRequest);

                        if (switchResp == null || !switchResp.isSuccess()) {
                            log.warn("❌ [BANTEC] Switch rechazó transferencia. Response: {}", switchResp);

                            BigDecimal saldoRevertido = procesarSaldo(trx.getIdCuentaOrigen(), montoTotal);
                            log.info("🔄 [BANTEC] Saldo revertido en cuenta {}. Nuevo saldo: {}",
                                    trx.getIdCuentaOrigen(), saldoRevertido);

                            String switchError = "Error desconocido";
                            if (switchResp != null && switchResp.getError() != null) {
                                switchError = switchResp.getError().getMessage();
                            }

                            trx.setEstado("FALLIDA");
                            trx.setSaldoResultante(saldoRevertido);
                            trx.setDescripcion("RECHAZADA POR SWITCH: " + switchError);

                            Transaccion fallida = transaccionRepository.save(trx);
                            return mapearADTO(fallida, null);
                        }

                        log.info("✅ [BANTEC] Transferencia aceptada por el switch (ACK). Iniciando Polling de confirmación...");
                        
                        // POLLING SÍNCRONO (15 segundos máx)
                        boolean confirmado = false;
                        String ultimoEstado = "PENDING";
                        String motivoFallo = "";

                        for (int i = 0; i < 10; i++) {
                            try {
                                Thread.sleep(1500); // 1.5s wait
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                break;
                            }

                            try {
                                SwitchTransferResponse statusResp = switchClient.consultarEstadoTransferencia(trx.getReferencia());
                                if (statusResp != null && statusResp.getData() != null) {
                                    ultimoEstado = statusResp.getData().getEstado();
                                    
                                    if ("COMPLETED".equalsIgnoreCase(ultimoEstado) || "EXITOSA".equalsIgnoreCase(ultimoEstado)) {
                                        confirmado = true;
                                        log.info("✅ Polling: Transacción CONFIRMADA en intento #{}", i + 1);
                                        break;
                                    }
                                    
                                    if ("FAILED".equalsIgnoreCase(ultimoEstado) || "FALLIDA".equalsIgnoreCase(ultimoEstado) || "RECHAZADA".equalsIgnoreCase(ultimoEstado)) {
                                        log.warn("❌ Polling: Switch reportó FALLO en intento #{}. Motivo: {}", i + 1, statusResp.getError());
                                        motivoFallo = (statusResp.getError() != null) ? statusResp.getError().getMessage() : "Rechazo desconocido";
                                        
                                        // REVERSO LOCAL INMEDIATO
                                        BigDecimal saldoRevertido = procesarSaldo(trx.getIdCuentaOrigen(), montoTotal);
                                        trx.setEstado("FALLIDA");
                                        trx.setSaldoResultante(saldoRevertido);
                                        trx.setDescripcion("RECHAZADA POR DESTINO: " + motivoFallo);
                                        Transaccion fallida = transaccionRepository.save(trx);
                                        
                                        throw new BusinessException("Transacción Rechazada: " + motivoFallo);
                                    }
                                }
                            } catch (Exception e) {
                                log.warn("⚠️ Error en polling intento #{}: {}", i + 1, e.getMessage());
                            }
                        }

                        if (confirmado) {
                            saldoImpactado = saldoDebitado;
                            trx.setEstado("COMPLETADA"); // Confirmado
                        } else {
                            // TIMEOUT o no confirmado aún
                            log.warn("⚠️ Polling finalizado sin confirmación (TIMEOUT). Estado último: {}", ultimoEstado);
                            // No revertimos, dejamos en PENDIENTE/EN_PROCESO. El usuario recibirá aviso de "En proceso".
                            saldoImpactado = saldoDebitado; // El dinero sigue debitado temporalmente
                            trx.setEstado("PENDIENTE");
                            trx.setDescripcion("En proceso de validación. Le notificaremos.");
                            trx.setSaldoResultante(saldoDebitado); // FIX: Guardar el saldo impactado para que no quede en 0
                            
                            // Guardamos estado pendiente
                            Transaccion pendiente = transaccionRepository.save(trx);
                            TransaccionResponseDTO respDto = mapearADTO(pendiente, null);
                            respDto.setMensajeUsuario("En proceso de validación. Le notificaremos.");
                            return respDto;
                        }

                    } catch (Exception e) {
                        log.error("❌ [BANTEC] Error de comunicación con switch, revirtiendo débito: {}",
                                e.getMessage());

                        // INTENTO DE REVERSO AUTOMÁTICO AL SWITCH (SAFETY CATCH)
                        // Si fue un Timeout, el Switch podría haberla procesado. Enviamos reverso para cancelar.
                        try {
                             log.warn("⚠️ Intentando notificar reverso automático al Switch (Safety Check)...");
                             String revMessageId = "MSG-REV-AUTO-" + System.currentTimeMillis();
                             String revCreationTime = java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC)
                                     .format(java.time.format.DateTimeFormatter.ISO_INSTANT);
                             
                             SwitchRefundRequest refundReq = SwitchRefundRequest.builder()
                                 .header(SwitchRefundRequest.Header.builder()
                                         .messageId(revMessageId)
                                         .creationDateTime(revCreationTime)
                                         .originatingBankId(codigoBanco)
                                         .build())
                                 .body(SwitchRefundRequest.Body.builder()
                                         .returnInstructionId(UUID.randomUUID().toString())
                                         .originalInstructionId(trx.getReferencia())
                                         .returnReason("MS03") // Technical Error
                                         .returnAmount(SwitchRefundRequest.Amount.builder()
                                                 .currency("USD")
                                                 .value(trx.getMonto())
                                                 .build())
                                         .build())
                                 .build();
                             
                             try {
                                 SwitchTransferResponse revResp = switchClient.solicitarDevolucion(refundReq);
                                 if (revResp != null && revResp.isSuccess()) {
                                     log.info("✅ Reverso automático aceptado por Switch.");
                                 } else {
                                     log.warn("⚠️ Switch rechazó reverso automático: {}", revResp);
                                 }
                             } catch (Exception exRev) {
                                 String err = exRev.getMessage();
                                 if (err != null && err.contains("409") && err.contains("Transacción original no encontrada")) {
                                     log.info("✅ Switch confirmó 409 (Tx no encontrada), por lo tanto está reversada efectivamente.");
                                 } else {
                                     throw exRev; // Propagar para loguear en el catch externo
                                 }
                             }
                        } catch (Exception ex) {
                            // Ignoramos errores aquí porque lo importante es el reverso local que sigue a continuación
                            log.warn("⚠️ Falló el intento de reverso automático en Switch (Esperable si Switch está caído): {}", ex.getMessage());
                        }

                        BigDecimal saldoRevertido = procesarSaldo(trx.getIdCuentaOrigen(), montoTotal);
                        log.info("🔄 [BANTEC] Saldo revertido por error técnico en cta {}. Nuevo saldo: {}",
                                trx.getIdCuentaOrigen(), saldoRevertido);

                        trx.setEstado("FALLIDA");
                        trx.setSaldoResultante(saldoRevertido);
                        trx.setDescripcion("ERROR TÉCNICO SWITCH: " + e.getMessage());

                        Transaccion fallida = transaccionRepository.save(trx);
                        return mapearADTO(fallida, null);
                    }
                }

                case "TRANSFERENCIA_ENTRADA" -> {
                    if (request.getIdCuentaDestino() == null)
                        throw new BusinessException("Falta cuenta destino para recepción externa.");
                    trx.setIdCuentaDestino(request.getIdCuentaDestino());
                    trx.setIdCuentaOrigen(null);
                    saldoImpactado = procesarSaldo(trx.getIdCuentaDestino(), request.getMonto());
                }

                default -> throw new BusinessException("Tipo de operación no soportado: " + tipoOp);
            }

            trx.setSaldoResultante(saldoImpactado);
            trx.setEstado("COMPLETADA");

            Transaccion guardada = transaccionRepository.save(trx);
            log.info("Transacción guardada ID: {}", guardada.getIdTransaccion());

            return mapearADTO(guardada, null);

        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Error técnico procesando transacción: ", e);
            throw e;
        }
    }

    @Override
    public List<TransaccionResponseDTO> obtenerPorCuenta(Integer idCuenta) {
        return transaccionRepository.findPorCuenta(idCuenta).stream()
                .map(t -> mapearADTO(t, idCuenta))
                .collect(Collectors.toList());
    }

    @Override
    public TransaccionResponseDTO obtenerPorId(Integer id) {
        if (id == null) {
            throw new BusinessException("El ID de la transacción no puede ser nulo.");
        }
        Transaccion t = transaccionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Transacción no encontrada con ID: " + id));
        return mapearADTO(t, null);
    }

    private BigDecimal procesarSaldo(Integer idCuenta, BigDecimal montoCambio) {
        BigDecimal saldoActual;

        try {
            saldoActual = cuentaCliente.obtenerSaldo(idCuenta);
            if (saldoActual == null) {
                throw new BusinessException("La cuenta ID " + idCuenta + " existe pero retornó saldo nulo.");
            }
        } catch (Exception e) {
            log.error("Error conectando con MS Cuentas: {}", e.getMessage());
            throw new BusinessException("No se pudo validar la cuenta ID: " + idCuenta + ". Verifique que exista.");
        }

        BigDecimal nuevoSaldo = saldoActual.add(montoCambio);

        if (nuevoSaldo.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(
                    "Fondos insuficientes en la cuenta ID: " + idCuenta + ". Saldo actual: " + saldoActual);
        }

        try {
            cuentaCliente.actualizarSaldo(idCuenta, new SaldoDTO(nuevoSaldo));
        } catch (Exception e) {
            throw new BusinessException("Error al actualizar el saldo de la cuenta ID: " + idCuenta);
        }

        return nuevoSaldo;
    }

    private TransaccionResponseDTO mapearADTO(Transaccion t, Integer idCuentaVisor) {
        BigDecimal saldoAMostrar = t.getSaldoResultante();

        log.info("Mapeando Tx: {}, Visor: {}, Dest: {}, SaldoDest: {}",
                t.getIdTransaccion(), idCuentaVisor, t.getIdCuentaDestino(), t.getSaldoResultanteDestino());

        if (idCuentaVisor != null &&
                t.getIdCuentaDestino() != null &&
                t.getIdCuentaDestino().equals(idCuentaVisor) &&
                t.getSaldoResultanteDestino() != null) {

            saldoAMostrar = t.getSaldoResultanteDestino();
        }

        return TransaccionResponseDTO.builder()
                .idTransaccion(t.getIdTransaccion())
                .referencia(t.getReferencia())
                .tipoOperacion(t.getTipoOperacion())
                .idCuentaOrigen(t.getIdCuentaOrigen())
                .idCuentaDestino(t.getIdCuentaDestino())
                .cuentaExterna(t.getCuentaExterna())
                .idBancoExterno(t.getIdBancoExterno())
                .monto(t.getMonto())
                .saldoResultante(saldoAMostrar)
                .fechaCreacion(t.getFechaCreacion())
                .descripcion(t.getDescripcion())
                .canal(t.getCanal())
                .estado(t.getEstado())
                .build();
    }

    private String obtenerNumeroCuenta(Integer idCuenta) {
        try {
            Map<String, Object> cuenta = cuentaCliente.obtenerCuenta(idCuenta);
            if (cuenta != null && cuenta.get("numeroCuenta") != null) {
                return cuenta.get("numeroCuenta").toString();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener número de cuenta para ID {}: {}", idCuenta, e.getMessage());
        }
        return String.valueOf(idCuenta);
    }

    private Integer obtenerIdCuentaPorNumero(String numeroCuenta) {
        try {
            Map<String, Object> cuenta = cuentaCliente.buscarPorNumero(numeroCuenta);
            if (cuenta != null && cuenta.get("idCuenta") != null) {
                return Integer.valueOf(cuenta.get("idCuenta").toString());
            }
        } catch (Exception e) {
            log.error("Error buscando cuenta por número {}: {}", numeroCuenta, e.getMessage());
        }
        return null;
    }

    @Override
    @Transactional
    public void procesarTransferenciaEntrante(String instructionId, String cuentaDestino,
            BigDecimal monto, String bancoOrigen) {
        log.info("📥 Procesando transferencia entrante desde {} a cuenta {}, monto: {}",
                bancoOrigen, cuentaDestino, monto);

        Integer idCuentaDestino = obtenerIdCuentaPorNumero(cuentaDestino);

        if (idCuentaDestino == null) {
            log.warn("❌ Cuenta destino {} no encontrada. Rechazando con AC01.", cuentaDestino);
            throw new BusinessException("AC01", "AC01 - Número de cuenta incorrecto o inexistente en Banco Destino");
        }

        if (transaccionRepository.findByReferencia(instructionId).isPresent()) {
            log.warn("Transferencia entrante duplicada ignorada: {}", instructionId);
            return;
        }

        BigDecimal nuevoSaldo = procesarSaldo(idCuentaDestino, monto);

        Transaccion trx = Transaccion.builder()
                .referencia(instructionId)
                .tipoOperacion("TRANSFERENCIA_ENTRADA")
                .idCuentaDestino(idCuentaDestino)
                .idCuentaOrigen(null)
                .cuentaExterna(cuentaDestino)
                .monto(monto)
                .saldoResultante(nuevoSaldo)
                .idBancoExterno(bancoOrigen)
                .descripcion("Transferencia recibida desde " + bancoOrigen)
                .canal("SWITCH")
                .estado("COMPLETADA")
                .build();

        transaccionRepository.save(trx);
        log.info("✅ Transferencia entrante completada. Ref: {}, Nuevo saldo: {}", instructionId, nuevoSaldo);
    }

    @Override
    @Transactional
    public void procesarDevolucionEntrante(SwitchRefundRequest request) {
        try {
            procesarDevolucionEntranteLogic(request);
            transaccionRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.warn(
                    "⚠️ DataIntegrityViolation (Duplicado) detectado al procesar devolución. Ignorando para idempotencia. Error: {}",
                    e.getMessage());
        }
    }

    private void procesarDevolucionEntranteLogic(SwitchRefundRequest request) {
        if (request.getHeader().getOriginatingBankId() != null &&
                request.getHeader().getOriginatingBankId().equalsIgnoreCase(codigoBanco)) {
            log.info("ℹ️ Ignorando Devolución originada por nosotros mismos (Echo/Confirmación).");
            return;
        }

        String originalId = request.getBody().getOriginalInstructionId();

        String returnId = request.getBody().getReturnInstructionId() != null
                ? request.getBody().getReturnInstructionId().trim()
                : null;
        String bancoOrigenRef = request.getHeader().getOriginatingBankId();

        log.info("🔙 Procesando devolución entrante. ReturnID: {}, Para Tx Original: {}, Desde Banco: {}",
                returnId, originalId, bancoOrigenRef);

        if (transaccionRepository.findByReferencia(returnId).isPresent()) {
            log.warn("⚠️ Devolución duplicada detectada (Ref: {}). Ignorando para evitar error de llave duplicada.",
                    returnId);
            return;
        }

        Transaccion originalTx = transaccionRepository.findPorReferenciaForUpdate(originalId)
                .orElse(null);

        if (originalTx == null) {
            log.error("❌ Transacción original no encontrada para devolución: {}", originalId);
            throw new BusinessException("Transacción original no encontrada");
        }

        java.time.LocalDateTime fechaReverso = java.time.LocalDateTime.now();
        if (request.getHeader().getCreationDateTime() != null) {
            try {
                fechaReverso = java.time.OffsetDateTime.parse(request.getHeader().getCreationDateTime())
                        .toLocalDateTime();
            } catch (Exception e) {
                log.warn("⚠️ No se pudo parsear fecha de reverso: {}. Usando fecha actual.",
                        request.getHeader().getCreationDateTime());
            }
        }

        BigDecimal amount = request.getBody().getReturnAmount().getValue();

        if ("TRANSFERENCIA_SALIDA".equals(originalTx.getTipoOperacion())) {

            if ("REVERSADA".equals(originalTx.getEstado()) || "DEVUELTA".equals(originalTx.getEstado())) {
                log.warn("⚠️ Transacción de salida ya marcada como devuelta.");
                return;
            }

            Integer idCuentaCliente = originalTx.getIdCuentaOrigen();
            BigDecimal nuevoSaldo = procesarSaldo(idCuentaCliente, amount);

            originalTx.setEstado("DEVUELTA");
            originalTx.setDescripcion(originalTx.getDescripcion() + " [DEVUELTA]");
            transaccionRepository.save(originalTx);

            Transaccion returnTx = Transaccion.builder()
                    .referencia(returnId)
                    .tipoOperacion("DEVOLUCION_RECIBIDA")
                    .monto(amount)
                    .idCuentaDestino(idCuentaCliente)
                    .saldoResultante(nuevoSaldo)
                    .descripcion("Devolución recibida: " + request.getBody().getReturnReason())
                    .canal("SWITCH")
                    .estado("COMPLETADA")
                    .idTransaccionReversa(originalTx.getIdTransaccion())
                    .idBancoExterno(bancoOrigenRef)
                    .fechaCreacion(fechaReverso)
                    .build();

            transaccionRepository.save(returnTx);
            log.info("✅ Devolución (Crédito) procesada exitosamente. Cliente acreditado.");

        } else if ("TRANSFERENCIA_ENTRADA".equals(originalTx.getTipoOperacion())) {

            if ("REVERSADA".equals(originalTx.getEstado()) || "DEVUELTA".equals(originalTx.getEstado())) {
                log.warn("⚠️ Transacción de entrada ya fue reversada anteriormente.");
                return;
            }

            Integer idCuentaCliente = originalTx.getIdCuentaDestino();
            log.info("💸 Procesando DEBITO por solicitud de reverso (ISO 20022). Cuenta afectada: {}", idCuentaCliente);

            try {
                BigDecimal nuevoSaldo = procesarSaldo(idCuentaCliente, amount.negate());

                originalTx.setEstado("REVERSADA");
                originalTx.setDescripcion(originalTx.getDescripcion() + " [REVERSADA SOLICITUD EXT]");
                transaccionRepository.save(originalTx);

                Transaccion debitTx = Transaccion.builder()
                        .referencia(returnId)
                        .tipoOperacion("REVERSO_DEBITO")
                        .monto(amount)
                        .idCuentaOrigen(idCuentaCliente)
                        .saldoResultante(nuevoSaldo)
                        .descripcion("Reverso solicitado por banco origen: " + request.getBody().getReturnReason())
                        .canal("SWITCH")
                        .estado("COMPLETADA")
                        .idTransaccionReversa(originalTx.getIdTransaccion())
                        .idBancoExterno(bancoOrigenRef)
                        .fechaCreacion(fechaReverso)
                        .build();

                transaccionRepository.save(debitTx);
                log.info("✅ Reverso (Débito) ejecutado exitosamente. Fondos devueltos al Switch.");

            } catch (BusinessException e) {
                log.error("❌ No se pudo ejecutar el reverso (Fondos insuficientes o cuenta bloqueada): {}",
                        e.getMessage());
                throw new BusinessException(
                        "No se puede ejecutar el reverso: Fondos insuficientes en la cuenta del cliente.");
            }

        } else {
            log.warn("⚠️ Tipo de operación original no soportada para devolución: {}", originalTx.getTipoOperacion());
        }
    }

    @Override
    @Transactional
    public void solicitarReverso(RefoundRequestDTO requestDTO) {
        log.info("🔄 Procesando solicitud de reverso para Tx ID: {}", requestDTO.getIdTransaccion());

        Transaccion originalTx = transaccionRepository.findById(requestDTO.getIdTransaccion())
                .orElseThrow(() -> new BusinessException("Transacción no encontrada"));

        if (!"COMPLETADA".equals(originalTx.getEstado()) && !"EXITOSA".equals(originalTx.getEstado())) {
            throw new BusinessException("Solo se pueden revertir transacciones completadas.");
        }

        if (originalTx.getIdTransaccionReversa() != null) {
            throw new BusinessException("Esta transacción ya fue revertida anteriormente.");
        }

        String messageId = UUID.randomUUID().toString();
        String creationTime = java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC)
                .truncatedTo(java.time.temporal.ChronoUnit.SECONDS)
                .format(java.time.format.DateTimeFormatter.ISO_INSTANT);
        String returnId = UUID.randomUUID().toString();

        SwitchRefundRequest switchRequest = SwitchRefundRequest.builder()
                .header(SwitchRefundRequest.Header.builder()
                        .messageId(messageId)
                        .creationDateTime(creationTime)
                        .originatingBankId(codigoBanco)
                        .build())
                .body(SwitchRefundRequest.Body.builder()
                        .returnInstructionId(returnId)
                        .originalInstructionId(originalTx.getReferencia())
                        .returnReason(requestDTO.getMotivo())
                        .returnAmount(SwitchRefundRequest.Amount.builder()
                                .currency("USD")
                                .value(originalTx.getMonto())
                                .build())

                        .build())
                .build();

        SwitchTransferResponse response = null;

        try {
            log.info("📤 Enviando solicitud de reverso al Switch (pacs.004)...");
            String motivoIso = mapearCodigoErrorInternalToISO(requestDTO.getMotivo());
            switchRequest.getBody().setReturnReason(motivoIso);
            
            response = switchClient.solicitarDevolucion(switchRequest);
            
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.contains("409") && errorMsg.contains("Transacción original no encontrada")) {
                log.warn("⚠️ Switch reportó transacción no encontrada (409) durante el reverso. Asumiendo que la transacción nunca existió o falló previamente. Procediendo con el reverso local.");
                response = SwitchTransferResponse.builder()
                        .success(true)
                        .build();
            } else {
               log.error("Error técnico al solicitar reverso: ", e);
                // Si es un error desconocido, lanzamos excepción
               throw new BusinessException("Error de comunicación con el Switch: " + errorMsg);
            }
        }

        try {
            if (response != null && response.isSuccess()) {
                log.info("✅ Reverso APROBADO por el Switch (o no encontrado). Realizando crédito interno...");

                BigDecimal nuevoSaldo = procesarSaldo(originalTx.getIdCuentaOrigen(), originalTx.getMonto());

                originalTx.setEstado("REVERSADA");
                originalTx.setDescripcion(originalTx.getDescripcion() + " [REVERSADA: " + requestDTO.getMotivo() + "]");
                transaccionRepository.save(originalTx);

                Transaccion reversaTx = Transaccion.builder()
                        .referencia(returnId)
                        .tipoOperacion("DEVOLUCION_RECIBIDA")
                        .monto(originalTx.getMonto())
                        .descripcion(
                                "Devolución de Tx " + originalTx.getIdTransaccion() + ": " + requestDTO.getMotivo())
                        .canal("WEB")
                        .idCuentaDestino(originalTx.getIdCuentaOrigen())
                        .saldoResultante(nuevoSaldo)
                        .estado("COMPLETADA")
                        .idTransaccionReversa(originalTx.getIdTransaccion())
                        .build();

                try {
                    transaccionRepository.save(reversaTx);
                } catch (org.springframework.dao.DataIntegrityViolationException e) {
                    log.warn("⚠️ Ignorando duplicado al guardar reversa (posible race condition con webhook): {}",
                            e.getMessage());
                }
                log.info("✅ Devolución completada localmente.");

            } else {
                String errorMsg = (response != null && response.getError() != null)
                        ? response.getError().getMessage()
                        : "Rechazo desconocido del Switch";
                log.warn("❌ Switch rechazó el reverso: {}", errorMsg);
                throw new BusinessException("El Switch rechazó la devolución: " + errorMsg);
            }

        } catch (Exception e) {
             if (e instanceof BusinessException) throw e;
             log.error("Error al procesar el reverso local: ", e);
             throw new BusinessException("Error interno al procesar reverso: " + e.getMessage());
        }
    }

    @Override
    public java.util.List<java.util.Map<String, String>> obtenerMotivosDevolucion() {
        return switchClient.obtenerMotivosDevolucion();
    }

    private String mapearCodigoErrorInternalToISO(String codigoInterno) {
        if (codigoInterno == null)
            return "MS03";

        switch (codigoInterno.trim().toUpperCase()) {
            case "TECH":
                return "MS03";
            case "CUENTA_INVALIDA":
                return "AC03";
            case "SALDO_INSUFICIENTE":
                return "AM04";
            case "DUPLICADO":
                return "MD01";
            default:

                return "MS03";
        }
    }

    @Override
    @Transactional
    public String consultarEstadoTransferencia(String instructionId) {
        Transaccion tx = transaccionRepository.findByReferencia(instructionId).orElse(null);
        
        if (tx == null) {
            return "NOT_FOUND";
        }

        if ("PENDIENTE".equals(tx.getEstado())) {
            log.info("🕵️ Validando estado PENDIENTE en Switch para Ref: {}", instructionId);
            try {
                SwitchTransferResponse resp = switchClient.consultarEstadoTransferencia(instructionId);
                if (resp != null && resp.getData() != null) {
                    String estadoSwitch = resp.getData().getEstado();
                    log.info("🔍 [DEBUG] Estado recibido del Switch para {}: {}", instructionId, estadoSwitch);

                    if ("COMPLETED".equalsIgnoreCase(estadoSwitch) || "EXITOSA".equalsIgnoreCase(estadoSwitch)) {
                        log.info("✅ Transacción confirmada tras validación tardía.");
                        tx.setEstado("COMPLETADA");
                        tx.setDescripcion(tx.getDescripcion().replace("En proceso de validación. Le notificaremos.", "Transferencia Finalizada"));
                        transaccionRepository.save(tx);
                        return "COMPLETED";
                    } 
                    
                    if ("FAILED".equalsIgnoreCase(estadoSwitch) || "FALLIDA".equalsIgnoreCase(estadoSwitch) || "RECHAZADA".equalsIgnoreCase(estadoSwitch)) {
                         log.warn("❌ Transacción fallida detectada tras validación tardía.");
                         tx.setEstado("FALLIDA");
                         String motivo = (resp.getError() != null) ? resp.getError().getMessage() : "Fallo confirmado por Switch";
                         tx.setDescripcion("RECHAZADA: " + motivo);
                         transaccionRepository.save(tx);
                         return "FAILED";
                    }
                }
            } catch (Exception e) {
                String errorMsg = e.getMessage();
                if (errorMsg != null && (errorMsg.contains("404") || errorMsg.contains("Not Found"))) {
                     log.warn("⚠️ Transacción no encontrada en Switch (404). Marcando como FALLIDA.");
                     tx.setEstado("FALLIDA");
                     tx.setDescripcion("RECHAZADA: No encontrada en destino (Posible timeout previo)");
                     transaccionRepository.save(tx);
                     return "FAILED";
                }
                log.warn("⚠️ No se pudo validar estado en Switch (Lazy Update): {}", e.getMessage());
            }
            return "PENDING";
        }

        String estado = tx.getEstado();
        if ("COMPLETADA".equals(estado) || "EXITOSA".equals(estado) || "DEVUELTA".equals(estado)) {
            return "COMPLETED";
        } else if ("FALLIDA".equals(estado) || "REVERSADA".equals(estado)) {
            return "FAILED";
        }
        
        return "PENDING";
    }
}