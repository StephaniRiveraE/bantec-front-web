package com.arcbank.sucursales.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class SucursalDTO {

    private String idSucursal;
    private String codigoUnico;
    private String nombre;
    private String direccion;
    private String telefono;
    private Double latitud;
    private Double longitud;
    private String estado;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaApertura;

    private EntidadBancariaDTO entidadBancaria;
    private UbicacionDTO ubicacion;

    @Getter
    @Setter
    public static class EntidadBancariaDTO {
        private String nombre;
        private String ruc;
        private String estado;
    }

    @Getter
    @Setter
    public static class UbicacionDTO {
        private String provincia;
        private String canton;
        private String parroquia;
        private List<FeriadoDTO> feriados;
    }

    @Getter
    @Setter
    public static class FeriadoDTO {
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate fecha;
        private String descripcion;
        private String tipoFeriado;
        private boolean activo;
    }
}
