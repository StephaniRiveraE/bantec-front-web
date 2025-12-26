package com.arcbank.cuenta.exception; // PAQUETE CORREGIDO

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
