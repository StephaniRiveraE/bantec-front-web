package com.arcbank.cuenta.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.arcbank.cuenta.dto.CuentaAhorroDTO;
import com.arcbank.cuenta.dto.CuentaAhorroRequest;
import com.arcbank.cuenta.model.CuentaAhorro;
import com.arcbank.cuenta.model.TipoCuentaAhorro;
import com.arcbank.cuenta.repository.CuentaAhorroRepository;
import com.arcbank.cuenta.repository.TipoCuentaAhorroRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CuentaAhorroService {

    private final CuentaAhorroRepository cuentaRepo;
    private final TipoCuentaAhorroRepository tipoRepo;

    @Transactional
    public CuentaAhorroDTO create(CuentaAhorroRequest request) {
        // Validación de existencia del Tipo de Cuenta
        TipoCuentaAhorro tipo = tipoRepo.findById(request.getIdTipoCuenta())
                .orElseThrow(
                        () -> new EntityNotFoundException("TipoCuenta no encontrada: " + request.getIdTipoCuenta()));

        CuentaAhorro c = new CuentaAhorro();
        c.setNumeroCuenta(request.getNumeroCuenta());
        c.setIdCliente(request.getIdCliente());
        c.setIdSucursalApertura(request.getIdSucursalApertura());
        c.setTipoCuenta(tipo);
        c.setSaldoActual(request.getSaldoInicial());
        c.setSaldoDisponible(request.getSaldoInicial()); // Inicialmente iguales
        c.setEstado("ACTIVA");
        // FechaApertura se setea en @PrePersist de la Entidad o aquí:
        c.setFechaApertura(java.time.LocalDate.now());

        CuentaAhorro saved = cuentaRepo.save(c);
        log.info("Cuenta creada: {}", saved.getNumeroCuenta());
        return toDTO(saved);
    }

    public CuentaAhorroDTO findById(Integer id) {
        return cuentaRepo.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new EntityNotFoundException("Cuenta no encontrada ID: " + id));
    }

    public List<CuentaAhorroDTO> findAll() {
        return cuentaRepo.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public BigDecimal getSaldo(Integer id) {
        return cuentaRepo.findById(id)
                .map(CuentaAhorro::getSaldoDisponible)
                .orElseThrow(() -> new EntityNotFoundException("Cuenta no encontrada ID: " + id));
    }

    public CuentaAhorroDTO findByNumeroCuenta(String numeroCuenta) {
        // Limpiar posibles ceros al inicio del número de cuenta
        String numLimpio = numeroCuenta.replaceFirst("^0+", "");
        return cuentaRepo.findByNumeroCuenta(numLimpio)
                .map(this::toDTO)
                .orElseGet(() -> cuentaRepo.findByNumeroCuenta(numeroCuenta)
                        .map(this::toDTO)
                        .orElseThrow(() -> new EntityNotFoundException("Cuenta no encontrada: " + numeroCuenta)));
    }

    /**
     * MÉTODO CRÍTICO: Usado por ms-transaccion para actualizar saldos.
     * Recibe el nuevo saldo total calculado por el microservicio de transacciones.
     */
    @Transactional
    public void actualizarSaldo(Integer id, BigDecimal nuevoSaldo) {
        CuentaAhorro c = cuentaRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cuenta no encontrada ID: " + id));

        // Actualizamos ambos saldos (Contable y Disponible)
        c.setSaldoActual(nuevoSaldo);
        c.setSaldoDisponible(nuevoSaldo);
        c.setFechaUltimaTransaccion(LocalDateTime.now());

        cuentaRepo.save(c);
        log.info("Saldo actualizado para cuenta ID {}: Nuevo Saldo {}", id, nuevoSaldo);
    }

    // Eliminé deposit/withdraw internos porque esa lógica ahora reside centralizada
    // en ms-transaccion

    private CuentaAhorroDTO toDTO(CuentaAhorro c) {
        CuentaAhorroDTO dto = new CuentaAhorroDTO();
        dto.setIdCuenta(c.getIdCuenta());
        dto.setNumeroCuenta(c.getNumeroCuenta());
        dto.setIdCliente(c.getIdCliente());
        dto.setIdSucursalApertura(c.getIdSucursalApertura());
        dto.setIdTipoCuenta(c.getTipoCuenta().getIdTipoCuenta());
        dto.setSaldoActual(c.getSaldoActual());
        dto.setSaldoDisponible(c.getSaldoDisponible());
        dto.setFechaApertura(c.getFechaApertura());
        dto.setFechaUltimaTransaccion(c.getFechaUltimaTransaccion());
        dto.setEstado(c.getEstado());
        return dto;
    }
}
