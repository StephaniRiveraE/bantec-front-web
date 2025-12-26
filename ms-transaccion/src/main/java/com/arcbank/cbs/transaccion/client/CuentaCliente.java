package com.arcbank.cbs.transaccion.client;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.arcbank.cbs.transaccion.dto.SaldoDTO;

/**
 * Cliente Feign para comunicación con micro-cuentas
 * URL configurable via: app.feign.cuentas-url
 */
@FeignClient(name = "ms-cuentas", url = "${app.feign.cuentas-url:http://localhost:8081}")
public interface CuentaCliente {

    // 1. Obtener saldo (GET)
    @GetMapping("/api/v1/cuentas/ahorros/{id}/saldo")
    BigDecimal obtenerSaldo(@PathVariable("id") Integer id);

    // 2. Actualizar saldo (PUT)
    @PutMapping("/api/v1/cuentas/ahorros/{id}/saldo")
    void actualizarSaldo(@PathVariable("id") Integer id, @RequestBody SaldoDTO saldoDTO);

    // 3. Obtener detalles completos de una cuenta por ID
    @GetMapping("/api/v1/cuentas/ahorros/{id}")
    Map<String, Object> obtenerCuenta(@PathVariable("id") Integer id);

    // 4. Buscar cuenta por número de cuenta (para transferencias interbancarias)
    @GetMapping("/api/v1/cuentas/ahorros/buscar/{numeroCuenta}")
    Map<String, Object> buscarPorNumero(@PathVariable("numeroCuenta") String numeroCuenta);
}