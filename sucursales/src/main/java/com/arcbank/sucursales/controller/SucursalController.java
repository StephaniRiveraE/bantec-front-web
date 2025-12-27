package com.arcbank.sucursales.controller;

import com.arcbank.sucursales.dto.request.SucursalRequest;
import com.arcbank.sucursales.dto.response.SucursalDTO;
import com.arcbank.sucursales.service.SucursalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sucursales/v1/sucursales")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Sucursales", description = "Gestión de sucursales en MongoDB")
public class SucursalController {

    private final SucursalService service;

    @Operation(summary = "Crear sucursal")
    @PostMapping
    public ResponseEntity<SucursalDTO> create(@Valid @RequestBody SucursalRequest request) {
        log.info("Creando sucursal {}", request.getCodigoUnico());
        return ResponseEntity.ok(service.create(request));
    }

    @Operation(summary = "Obtener sucursal por ID")
    @GetMapping("/{id}")
    public ResponseEntity<SucursalDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @Operation(summary = "Listar todas las sucursales")
    @GetMapping
    public ResponseEntity<List<SucursalDTO>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @Operation(summary = "Buscar sucursales por provincia")
    @GetMapping("/provincia/{provincia}")
    public ResponseEntity<List<SucursalDTO>> byProvincia(@PathVariable String provincia) {
        return ResponseEntity.ok(service.findByProvincia(provincia));
    }

    @Operation(summary = "Buscar sucursales por cantón")
    @GetMapping("/canton/{canton}")
    public ResponseEntity<List<SucursalDTO>> byCanton(@PathVariable String canton) {
        return ResponseEntity.ok(service.findByCanton(canton));
    }

    @Operation(summary = "Buscar sucursales por parroquia")
    @GetMapping("/parroquia/{parroquia}")
    public ResponseEntity<List<SucursalDTO>> byParroquia(@PathVariable String parroquia) {
        return ResponseEntity.ok(service.findByParroquia(parroquia));
    }

    @Operation(summary = "Obtener feriados asociados a una sucursal (según ubicación)")
    @GetMapping("/{codigoUnico}/feriados")
    public ResponseEntity<List<SucursalDTO.FeriadoDTO>> getFeriados(@PathVariable String codigoUnico) {
        return ResponseEntity.ok(service.getFeriados(codigoUnico));
    }
}
