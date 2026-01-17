package com.arcbank.cuenta.controller;

import com.arcbank.cuenta.dto.CuentaAhorroDTO;
import com.arcbank.cuenta.dto.CuentaAhorroRequest;
import com.arcbank.cuenta.dto.SaldoDTO;
import com.arcbank.cuenta.service.CuentaAhorroService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/cuentas/ahorros")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cuentas de Ahorro", description = "Gestión de cuentas de ahorro")
public class CuentaAhorroController {

    private final CuentaAhorroService service;

    @Operation(summary = "Crear cuenta de ahorro")
    @PostMapping
    public ResponseEntity<CuentaAhorroDTO> create(@Valid @RequestBody CuentaAhorroRequest request) {
        log.info("Creando cuenta {}", request.getNumeroCuenta());
        return new ResponseEntity<>(service.create(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Obtener cuenta por ID")
    @GetMapping("/{id}")
    public ResponseEntity<CuentaAhorroDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @Operation(summary = "Listar cuentas")
    @GetMapping
    public ResponseEntity<List<CuentaAhorroDTO>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @Operation(summary = "Consultar saldo")
    @GetMapping("/{id}/saldo")
    public ResponseEntity<BigDecimal> saldo(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getSaldo(id));
    }

    @Operation(summary = "Actualizar saldo (Interno)")
    @PutMapping("/{id}/saldo")
    public ResponseEntity<Void> actualizarSaldo(
            @PathVariable Integer id,
            @RequestBody SaldoDTO saldoDTO) {
        service.actualizarSaldo(id, saldoDTO.getSaldo());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Buscar cuenta por número de cuenta")
    @GetMapping("/buscar/{numeroCuenta}")
    public ResponseEntity<CuentaAhorroDTO> findByNumeroCuenta(@PathVariable String numeroCuenta) {
        log.info("Buscando cuenta por numero: {}", numeroCuenta);
        return ResponseEntity.ok(service.findByNumeroCuenta(numeroCuenta));
    }
}
