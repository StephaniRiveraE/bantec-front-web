package com.arcbank.MicroCliente.controller;

import com.arcbank.MicroCliente.dto.PersonaRequestDTO;
import com.arcbank.MicroCliente.dto.PersonaResponseDTO;
import com.arcbank.MicroCliente.service.PersonaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/personas")
@Tag(name = "Personas", description = "Gestión de personas naturales")
public class PersonaController {

    private final PersonaService personaService;

    public PersonaController(PersonaService personaService) {
        this.personaService = personaService;
    }

    @Operation(summary = "Crear persona")
    @PostMapping
    public ResponseEntity<PersonaResponseDTO> crearPersona(
            @Valid @RequestBody PersonaRequestDTO request) {
        return ResponseEntity.ok(personaService.crearPersona(request));
    }

    @Operation(summary = "Obtener persona por ID")
    @GetMapping("/{id}")
    public ResponseEntity<PersonaResponseDTO> obtenerPersona(@PathVariable Integer id) {
        return ResponseEntity.ok(personaService.obtenerPorId(id));
    }

    @Operation(summary = "Listar personas")
    @GetMapping
    public ResponseEntity<List<PersonaResponseDTO>> listarPersonas() {
        return ResponseEntity.ok(personaService.listarPersonas());
    }

    @Operation(summary = "Actualizar persona")
    @PutMapping("/{id}")
    public ResponseEntity<PersonaResponseDTO> actualizarPersona(
            @PathVariable Integer id,
            @Valid @RequestBody PersonaRequestDTO request) {
        return ResponseEntity.ok(personaService.actualizarPersona(id, request));
    }

    @Operation(summary = "Eliminar persona")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminarPersona(@PathVariable Integer id) {
        personaService.eliminarPersona(id);
        return ResponseEntity.ok("Persona eliminada correctamente");
    }
}
