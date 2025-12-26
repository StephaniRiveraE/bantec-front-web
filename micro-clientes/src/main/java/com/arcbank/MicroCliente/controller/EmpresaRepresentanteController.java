package com.arcbank.MicroCliente.controller;

import com.arcbank.MicroCliente.dto.EmpresaRepresentanteRequestDTO;
import com.arcbank.MicroCliente.dto.EmpresaRepresentanteResponseDTO;
import com.arcbank.MicroCliente.service.EmpresaRepresentanteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/empresas/{idEmpresa}/representantes")
@Tag(name = "Representantes", description = "Gestión de representantes legales")
public class EmpresaRepresentanteController {

    private final EmpresaRepresentanteService service;

    public EmpresaRepresentanteController(EmpresaRepresentanteService service) {
        this.service = service;
    }

    @Operation(summary = "Asignar representante legal")
    @PostMapping
    public EmpresaRepresentanteResponseDTO asignar(
            @PathVariable Integer idEmpresa,
            @Valid @RequestBody EmpresaRepresentanteRequestDTO dto) {
        return service.asignarRepresentante(idEmpresa, dto);
    }

    @Operation(summary = "Historial de representantes")
    @GetMapping
    public List<EmpresaRepresentanteResponseDTO> historial(
            @PathVariable Integer idEmpresa) {
        return service.historial(idEmpresa);
    }

    @Operation(summary = "Dar de baja representante activo")
    @DeleteMapping
    public void baja(@PathVariable Integer idEmpresa) {
        service.bajaRepresentante(idEmpresa);
    }
}
