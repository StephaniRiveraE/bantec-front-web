package com.arcbank.MicroCliente.controller;

import com.arcbank.MicroCliente.dto.EmpresaRequestDTO;
import com.arcbank.MicroCliente.dto.EmpresaResponseDTO;
import com.arcbank.MicroCliente.service.EmpresaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/empresas")
@RequiredArgsConstructor
@Tag(name = "Empresas", description = "Gestión de empresas")
public class EmpresaController {

    private final EmpresaService empresaService;

    @Operation(summary = "Crear empresa")
    @PostMapping
    public EmpresaResponseDTO crear(@Valid @RequestBody EmpresaRequestDTO request) {
        return empresaService.crearEmpresa(request);
    }

    @Operation(summary = "Obtener empresa por ID")
    @GetMapping("/{idCliente}")
    public EmpresaResponseDTO obtener(@PathVariable Integer idCliente) {
        return empresaService.obtenerEmpresa(idCliente);
    }

    @Operation(summary = "Listar empresas")
    @GetMapping
    public List<EmpresaResponseDTO> listar() {
        return empresaService.listarEmpresas();
    }

    @Operation(summary = "Actualizar empresa")
    @PutMapping("/{idCliente}")
    public EmpresaResponseDTO actualizar(
            @PathVariable Integer idCliente,
            @Valid @RequestBody EmpresaRequestDTO request) {
        return empresaService.actualizarEmpresa(idCliente, request);
    }

    @Operation(summary = "Dar de baja lógica a empresa")
    @PutMapping("/{idCliente}/baja")
    public void bajaLogica(@PathVariable Integer idCliente) {
        empresaService.bajaLogicaEmpresa(idCliente);
    }
}
