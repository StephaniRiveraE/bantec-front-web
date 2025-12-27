package com.arcbank.sucursales.mapper;

import com.arcbank.sucursales.dto.request.SucursalRequest;
import com.arcbank.sucursales.dto.response.SucursalDTO;
import com.arcbank.sucursales.model.EntidadBancaria;
import com.arcbank.sucursales.model.Feriado;
import com.arcbank.sucursales.model.FeriadosPorNivel;
import com.arcbank.sucursales.model.NivelUbicacion;
import com.arcbank.sucursales.model.Sucursal;
import com.arcbank.sucursales.model.Ubicacion;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class GeoLevelMapperImpl implements GeoLevelMapper {

    @Override
    public Sucursal toEntity(SucursalRequest request) {
        Sucursal s = new Sucursal();
        s.setCodigoUnico(request.getCodigoUnico());
        s.setNombre(request.getNombre());
        s.setDireccion(request.getDireccion());
        s.setTelefono(request.getTelefono());
        s.setLatitud(request.getLatitud());
        s.setLongitud(request.getLongitud());


        EntidadBancaria entidad = new EntidadBancaria();
        entidad.setNombre(request.getEntidadNombre());
        entidad.setRuc(request.getEntidadRuc());
        entidad.setEstado("ACTIVA");
        s.setEntidadBancaria(entidad);


        Ubicacion ubicacion = new Ubicacion();


        NivelUbicacion provincia = new NivelUbicacion();
        provincia.setNombre(request.getProvincia());
        ubicacion.setProvincia(provincia);


        NivelUbicacion canton = new NivelUbicacion();
        canton.setNombre(request.getCanton());
        ubicacion.setCanton(canton);


        NivelUbicacion parroquia = new NivelUbicacion();
        parroquia.setNombre(request.getParroquia());
        ubicacion.setParroquia(parroquia);


        if (request.getFeriados() != null && !request.getFeriados().isEmpty()) {
            List<Feriado> feriados = request.getFeriados().stream().map(fr -> {
                Feriado f = new Feriado();
                f.setFecha(fr.getFecha());
                f.setDescripcion(fr.getDescripcion());
                f.setTipoFeriado(fr.getTipoFeriado());
                f.setActivo(true);
                return f;
            }).collect(Collectors.toList());

            FeriadosPorNivel feriadosPorNivel = new FeriadosPorNivel();
            feriadosPorNivel.setProvincia(new ArrayList<>(feriados));
            feriadosPorNivel.setCanton(new ArrayList<>(feriados));
            feriadosPorNivel.setParroquia(new ArrayList<>(feriados));

            ubicacion.setFeriados(feriadosPorNivel);
        }

        s.setUbicacion(ubicacion);
        s.setEstado("ACTIVA");
        s.setFechaApertura(java.time.LocalDate.now());

        return s;
    }

    @Override
    public SucursalDTO toDTO(Sucursal s) {
        if (s == null) {
            return null;
        }

        SucursalDTO dto = new SucursalDTO();
        dto.setIdSucursal(s.getIdSucursal());
        dto.setCodigoUnico(s.getCodigoUnico());
        dto.setNombre(s.getNombre());
        dto.setDireccion(s.getDireccion());
        dto.setTelefono(s.getTelefono());
        dto.setLatitud(s.getLatitud());
        dto.setLongitud(s.getLongitud());
        dto.setEstado(s.getEstado());
        dto.setFechaApertura(s.getFechaApertura());

        if (s.getEntidadBancaria() != null) {
            SucursalDTO.EntidadBancariaDTO entidadDTO = new SucursalDTO.EntidadBancariaDTO();
            entidadDTO.setNombre(s.getEntidadBancaria().getNombre());
            entidadDTO.setRuc(s.getEntidadBancaria().getRuc());
            entidadDTO.setEstado(s.getEntidadBancaria().getEstado());
            dto.setEntidadBancaria(entidadDTO);
        }

        if (s.getUbicacion() != null) {
            SucursalDTO.UbicacionDTO ubicacionDTO = new SucursalDTO.UbicacionDTO();

            if (s.getUbicacion().getProvincia() != null) {
                ubicacionDTO.setProvincia(s.getUbicacion().getProvincia().getNombre());
            }
            if (s.getUbicacion().getCanton() != null) {
                ubicacionDTO.setCanton(s.getUbicacion().getCanton().getNombre());
            }
            if (s.getUbicacion().getParroquia() != null) {
                ubicacionDTO.setParroquia(s.getUbicacion().getParroquia().getNombre());
            }


            List<SucursalDTO.FeriadoDTO> feriadosDTO = new ArrayList<>();

            if (s.getUbicacion().getFeriados() != null) {
                FeriadosPorNivel fpl = s.getUbicacion().getFeriados();

                if (fpl.getProvincia() != null) {
                    feriadosDTO.addAll(
                            fpl.getProvincia().stream().map(this::toFeriadoDTO).collect(Collectors.toList())
                    );
                }
                if (fpl.getCanton() != null) {
                    feriadosDTO.addAll(
                            fpl.getCanton().stream().map(this::toFeriadoDTO).collect(Collectors.toList())
                    );
                }
                if (fpl.getParroquia() != null) {
                    feriadosDTO.addAll(
                            fpl.getParroquia().stream().map(this::toFeriadoDTO).collect(Collectors.toList())
                    );
                }
            }

            ubicacionDTO.setFeriados(feriadosDTO);
            dto.setUbicacion(ubicacionDTO);
        }

        return dto;
    }

    private SucursalDTO.FeriadoDTO toFeriadoDTO(Feriado f) {
        SucursalDTO.FeriadoDTO fd = new SucursalDTO.FeriadoDTO();
        fd.setFecha(f.getFecha());
        fd.setDescripcion(f.getDescripcion());
        fd.setTipoFeriado(f.getTipoFeriado());
        fd.setActivo(f.getActivo());
        return fd;
    }
}
