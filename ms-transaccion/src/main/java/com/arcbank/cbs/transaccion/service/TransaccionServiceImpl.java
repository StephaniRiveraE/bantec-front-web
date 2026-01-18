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

                    BigDecimal comision = new BigDecimal("0.45");
                    BigDecimal montoTotal = request.getMonto().add(comision);

                    trx.setIdCuentaOrigen(request.getIdCuentaOrigen());
                    trx.setIdCuentaDestino(null);
                    trx.setCuentaExterna(request.getCuentaExterna());
                    trx.setIdBancoExterno(request.getIdBancoExterno());
                    trx.setMonto(montoTotal);
                    trx.setDescripcion(request.getDescripcion() + " (Comisión interbancaria $0.45)");

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
                                        .instructionId(trx.getReferencia()) // Usamos la Referencia para poder
                                                                            // rastrearla después
                                        .endToEndId("REF-BANTEC-" + trx.getReferencia())
                                        .amount(SwitchTransferRequest.Amount.builder()
                                                .currency("USD")
                                                .value(request.getMonto())
                                                .build())
                                        .debtor(SwitchTransferRequest.Party.builder()
                                                .name(nombreDebtor)
                                                .accountId(numeroCuentaOrigen)
                                                .accountType(tipoCuentaDebtor)
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

                        log.info("✅ [BANTEC] Transferencia aceptada por el switch. Referencia: {}",
                                trx.getReferencia());
                        saldoImpactado = saldoDebitado;

                    } catch (Exception e) {
                        log.error("❌ [BANTEC] Error de comunicación con switch, revirtiendo débito: {}",
                                e.getMessage());

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

        // RULE < 48h: Initiate return if account not found
        if (idCuentaDestino == null) {
            log.warn("❌ Cuenta destino {} no encontrada. Iniciando devolución automática (Regla < 48h).",
                    cuentaDestino);

            String messageId = "MSG-RET-AUTO-" + System.currentTimeMillis();
            String creationTime = java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC)
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
                            .originalInstructionId(instructionId)
                            .returnReason("AC04") // Closed Account / Account Number Does Not Exist
                            .returnAmount(SwitchRefundRequest.Amount.builder()
                                    .currency("USD")
                                    .value(monto)
                                    .build())

                            .build())
                    .build();

            try {
                SwitchTransferResponse response = switchClient.solicitarDevolucion(switchRequest);
                if (response.isSuccess()) {
                    log.info("✅ Devolución automática iniciada exitosamente. ReturnId: {}", returnId);
                } else {
                    log.error("❌ Falló el inicio de la devolución automática: {}", response.getError());
                }
            } catch (Exception e) {
                log.error("❌ Error técnico enviando devolución automática: {}", e.getMessage());
            }
            return; // Stop processing
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
        String originalId = request.getBody().getOriginalInstructionId();
        log.info("🔙 Procesando devolución entrante para Tx Original: {}", originalId);

        Transaccion originalTx = transaccionRepository.findByReferencia(originalId)
                .orElse(null);

        if (originalTx == null) {
            log.error("❌ Transacción original no encontrada para devolución: {}", originalId);
            throw new BusinessException("Transacción original no encontrada");
        }

        // We expect originalTx to be TRANSFERENCIA_SALIDA (money went out, now coming
        // back)
        if (!"TRANSFERENCIA_SALIDA".equals(originalTx.getTipoOperacion())) {
            log.warn("⚠️ Recibida devolución para una transacción que no es de SALIDA: {}",
                    originalTx.getTipoOperacion());
            // Proceed anyway if it makes sense, but strictly returns credit usually applies
            // to debit ops.
        }

        if ("REVERSADA".equals(originalTx.getEstado()) || "DEVUELTA".equals(originalTx.getEstado())) {
            log.warn("⚠️ Transacción ya marcada como devuelta.");
            return;
        }

        BigDecimal amount = request.getBody().getReturnAmount().getValue();
        Integer idCuentaCliente = originalTx.getIdCuentaOrigen();

        // Credit the customer back
        BigDecimal nuevoSaldo = procesarSaldo(idCuentaCliente, amount);

        // Update original Tx state
        originalTx.setEstado("DEVUELTA");
        originalTx.setDescripcion(originalTx.getDescripcion() + " [DEVUELTA]");
        transaccionRepository.save(originalTx);

        // Create Record for Return
        Transaccion returnTx = Transaccion.builder()
                .referencia(request.getBody().getReturnInstructionId())
                .tipoOperacion("DEVOLUCION_RECIBIDA")
                .monto(amount)
                .idCuentaDestino(idCuentaCliente)
                .saldoResultante(nuevoSaldo)
                .descripcion("Devolución recibida: " + request.getBody().getReturnReason())
                .canal("SWITCH")
                .estado("COMPLETADA")
                .idTransaccionReversa(originalTx.getIdTransaccion())
                .build();

        transaccionRepository.save(returnTx);
        log.info("✅ Devolución procesada exitosamente. Cliente acreditado.");
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

        String messageId = "MSG-REV-BANTEC-" + System.currentTimeMillis();
        String creationTime = java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC)
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

        try {
            log.info("📤 Enviando solicitud de reverso al Switch (pacs.004)...");
            SwitchTransferResponse response = switchClient.solicitarDevolucion(switchRequest);

            if (response != null && response.isSuccess()) {
                log.info("✅ Reverso APROBADO por el Switch. Realizando crédito interno...");

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

                transaccionRepository.save(reversaTx);
                log.info("✅ Devolución completada localmente.");

            } else {
                String errorMsg = (response != null && response.getError() != null)
                        ? response.getError().getMessage()
                        : "Rechazo desconocido del Switch";
                log.warn("❌ Switch rechazó el reverso: {}", errorMsg);
                throw new BusinessException("El Switch rechazó la devolución: " + errorMsg);
            }

        } catch (Exception e) {
            log.error("Error técnico al solicitar reverso: ", e);
            if (e instanceof BusinessException)
                throw e;
            throw new BusinessException("Error de comunicación con el Switch: " + e.getMessage());
        }
    }
}