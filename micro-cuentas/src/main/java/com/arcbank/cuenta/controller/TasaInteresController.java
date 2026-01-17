package com.arcbank.cuenta.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.arcbank.cuenta.dto.TasaInteresHistorialDTO;
import com.arcbank.cuenta.dto.TasaInteresHistorialRequest;
import com.arcbank.cuenta.service.TasaInteresService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/cuentas/tasas")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tasas de Interés", description = "Gestión de tasas de interés")
public class TasaInteresController {

    private final TasaInteresService service;

    @Operation(summary = "Crear tasa de interés")
    @PostMapping
    public ResponseEntity<TasaInteresHistorialDTO> create(@Valid @RequestBody TasaInteresHistorialRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @Operation(summary = "Obtener tasa de interés por ID")
    @GetMapping("/{id}")
    public ResponseEntity<TasaInteresHistorialDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @Operation(summary = "Listar tasas de interés")
    @GetMapping
    public ResponseEntity<List<TasaInteresHistorialDTO>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @Operation(summary = "Eliminar tasa de interés")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
