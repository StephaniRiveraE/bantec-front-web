package com.arcbank.cbs.transaccion.controller;

import com.arcbank.cbs.transaccion.dto.TransaccionRequestDTO;
import com.arcbank.cbs.transaccion.dto.TransaccionResponseDTO;
import com.arcbank.cbs.transaccion.service.TransaccionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transacciones")
@RequiredArgsConstructor
@Tag(name = "Transacciones", description = "Gestión de movimientos y cumplimiento de lógica financiera")
public class Controller {

    private final TransaccionService transaccionService;

    @PostMapping
    @Operation(summary = "Ejecutar transacción financiera")
    public ResponseEntity<TransaccionResponseDTO> crear(@Valid @RequestBody TransaccionRequestDTO request) {
        return new ResponseEntity<>(transaccionService.crearTransaccion(request), HttpStatus.CREATED);
    }

    @GetMapping("/cuenta/{idCuenta}")
    @Operation(summary = "Historial por cuenta (Origen o Destino)")
    public ResponseEntity<List<TransaccionResponseDTO>> listarPorCuenta(@PathVariable Integer idCuenta) {
        return ResponseEntity.ok(transaccionService.obtenerPorCuenta(idCuenta));
    }
}