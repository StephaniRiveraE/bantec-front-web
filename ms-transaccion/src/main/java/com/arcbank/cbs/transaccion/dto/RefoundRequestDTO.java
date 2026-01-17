package com.arcbank.cbs.transaccion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefoundRequestDTO {

    @NotNull
    private Integer idTransaccion;

    @NotBlank
    private String motivo;

    private String observacion;
}
