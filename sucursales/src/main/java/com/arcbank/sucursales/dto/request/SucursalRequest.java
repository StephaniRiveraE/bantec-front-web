package com.arcbank.sucursales.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class SucursalRequest {

    @NotBlank(message = "Código único obligatorio")
    @Size(min = 3, max = 20)
    private String codigoUnico;

    @NotBlank(message = "Nombre obligatorio")
    private String nombre;

    @NotBlank(message = "Dirección obligatoria")
    private String direccion;

    @NotBlank(message = "Teléfono obligatorio")
    private String telefono;

    @NotNull(message = "Latitud obligatoria")
    private Double latitud;

    @NotNull(message = "Longitud obligatoria")
    private Double longitud;


    @NotBlank(message = "Nombre de entidad bancaria obligatorio")
    private String entidadNombre;

    @NotBlank(message = "RUC de entidad bancaria obligatorio")
    private String entidadRuc;


    @NotBlank(message = "Provincia obligatoria")
    private String provincia;

    @NotBlank(message = "Cantón obligatorio")
    private String canton;

    @NotBlank(message = "Parroquia obligatoria")
    private String parroquia;


    private List<FeriadoRequest> feriados;

    @Getter
    @Setter
    public static class FeriadoRequest {
        @NotNull(message = "Fecha de feriado obligatoria")
        private LocalDate fecha;

        @NotBlank(message = "Descripción obligatoria")
        private String descripcion;

        @NotBlank(message = "Tipo de feriado obligatorio")
        private String tipoFeriado;
    }
}
