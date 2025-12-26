package com.arcbank.cbs.transaccion.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException; // Importante para Spring Boot 3.2+

import java.time.LocalDateTime;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
        log.warn("Error de negocio: {}", ex.getMessage()); // Warn es mejor que Error para negocio
        ErrorResponse error = ErrorResponse.builder()
                .mensaje(ex.getMessage())
                .codigo("BUSINESS_ERROR")
                .fecha(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // --- NUEVO: Manejar recursos no encontrados (como Swagger assets o URLs mal
    // escritas) ---
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(NoResourceFoundException ex) {
        // No logueamos como error grave, solo debug
        log.debug("Recurso no encontrado: {}", ex.getResourcePath());
        ErrorResponse error = ErrorResponse.builder()
                .mensaje("El recurso solicitado no existe.")
                .codigo("NOT_FOUND")
                .fecha(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        // Imprime el Stack Trace completo en la consola para que sepas QUÉ pasó
        log.error("Error interno no controlado: ", ex);

        // TEMPORAL: Incluir mensaje real para depuración
        String mensajeReal = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getName();

        ErrorResponse error = ErrorResponse.builder()
                .mensaje("Error: " + mensajeReal)
                .codigo("INTERNAL_SERVER_ERROR")
                .fecha(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}