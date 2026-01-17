package com.arcbank.cuenta.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.arcbank.cuenta.dto.TipoCuentaAhorroDTO;
import com.arcbank.cuenta.dto.TipoCuentaAhorroRequest;
import com.arcbank.cuenta.service.TipoCuentaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/cuentas/tipos-cuenta")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipos de Cuenta", description = "Gestión de tipos de cuenta")
public class TipoCuentaController {

    private final TipoCuentaService service;

    @Operation(summary = "Crear tipo de cuenta")
    @PostMapping
    public ResponseEntity<TipoCuentaAhorroDTO> create(@Valid @RequestBody TipoCuentaAhorroRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @Operation(summary = "Actualizar tipo de cuenta")
    @PutMapping("/{id}")
    public ResponseEntity<TipoCuentaAhorroDTO> update(@PathVariable Integer id,
            @Valid @RequestBody TipoCuentaAhorroRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @Operation(summary = "Obtener tipo de cuenta por ID")
    @GetMapping("/{id}")
    public ResponseEntity<TipoCuentaAhorroDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @Operation(summary = "Listar tipos de cuenta")
    @GetMapping
    public ResponseEntity<List<TipoCuentaAhorroDTO>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @Operation(summary = "Eliminar tipo de cuenta")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
