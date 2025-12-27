package com.arcbank.sucursales.service;

import com.arcbank.sucursales.dto.request.SucursalRequest;
import com.arcbank.sucursales.dto.response.SucursalDTO;
import com.arcbank.sucursales.exception.ResourceNotFoundException;
import com.arcbank.sucursales.mapper.GeoLevelMapper;
import com.arcbank.sucursales.model.Sucursal;
import com.arcbank.sucursales.repository.SucursalRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class SucursalService {

    private final SucursalRepository sucursalRepository;
    private final GeoLevelMapper geoLevelMapper;
    private final RestClient restClient;

    @Transactional
    @CacheEvict(value = {"sucursalesById", "sucursalesByCodigo"}, allEntries = true)
    public SucursalDTO create(SucursalRequest request) {
        log.info("Creando sucursal con código {}", request.getCodigoUnico());

        sucursalRepository.findByCodigoUnico(request.getCodigoUnico())
                .ifPresent(s -> {
                    throw new IllegalArgumentException("codigoUnico ya existe: " + request.getCodigoUnico());
                });

        Sucursal sucursal = geoLevelMapper.toEntity(request);
        Sucursal saved = sucursalRepository.save(sucursal);

        notificarSucursalCreadaAsync(saved.getCodigoUnico());

        return geoLevelMapper.toDTO(saved);
    }

    @Transactional
    @CacheEvict(value = {"sucursalesById", "sucursalesByCodigo"}, allEntries = true)
    public SucursalDTO update(String id, SucursalRequest request) {
        log.info("Actualizando sucursal {}", id);

        Sucursal existente = sucursalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sucursal no encontrada: " + id));

        existente.setNombre(request.getNombre());
        existente.setDireccion(request.getDireccion());
        existente.setTelefono(request.getTelefono());
        existente.setLatitud(request.getLatitud());
        existente.setLongitud(request.getLongitud());

        Sucursal saved = sucursalRepository.save(existente);
        return geoLevelMapper.toDTO(saved);
    }

    @Transactional
    @CacheEvict(value = {"sucursalesById", "sucursalesByCodigo"}, allEntries = true)
    public void delete(String id) {
        log.info("Eliminando sucursal {}", id);
        Sucursal sucursal = sucursalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sucursal no encontrada: " + id));
        sucursalRepository.delete(sucursal);
    }

    @Cacheable(value = "sucursalesById", key = "#id")
    public SucursalDTO findById(String id) {
        log.info("Buscando sucursal por id {}", id);
        Sucursal sucursal = sucursalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sucursal no encontrada: " + id));
        return geoLevelMapper.toDTO(sucursal);
    }

    @Cacheable(value = "sucursalesByCodigo", key = "#codigoUnico")
    public SucursalDTO findByCodigoUnico(String codigoUnico) {
        log.info("Buscando sucursal por código {}", codigoUnico);
        Sucursal sucursal = sucursalRepository.findByCodigoUnico(codigoUnico)
                .orElseThrow(() -> new ResourceNotFoundException("Sucursal no encontrada: " + codigoUnico));
        return geoLevelMapper.toDTO(sucursal);
    }

    public List<SucursalDTO> findAll() {
        log.info("Listando todas las sucursales");
        return sucursalRepository.findAll()
                .stream()
                .map(geoLevelMapper::toDTO)
                .collect(Collectors.toList());
    }


    public List<SucursalDTO> findByProvincia(String provincia) {
        log.info("Buscando sucursales por provincia {}", provincia);
        return sucursalRepository.findByUbicacion_Provincia_Nombre(provincia)
                .stream()
                .map(geoLevelMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<SucursalDTO> findByCanton(String canton) {
        log.info("Buscando sucursales por cantón {}", canton);
        return sucursalRepository.findByUbicacion_Canton_Nombre(canton)
                .stream()
                .map(geoLevelMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<SucursalDTO> findByParroquia(String parroquia) {
        log.info("Buscando sucursales por parroquia {}", parroquia);
        return sucursalRepository.findByUbicacion_Parroquia_Nombre(parroquia)
                .stream()
                .map(geoLevelMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<SucursalDTO.FeriadoDTO> getFeriados(String codigoUnico) {
        log.info("Obteniendo feriados para sucursal {}", codigoUnico);

        Sucursal sucursal = sucursalRepository.findByCodigoUnico(codigoUnico)
                .orElseThrow(() -> new ResourceNotFoundException("Sucursal no encontrada: " + codigoUnico));

        SucursalDTO dto = geoLevelMapper.toDTO(sucursal);

        if (dto.getUbicacion() == null || dto.getUbicacion().getFeriados() == null) {
            return List.of();
        }
        return dto.getUbicacion().getFeriados();
    }


    @Async
    public void notificarSucursalCreadaAsync(String codigoUnico) {
        log.info("Enviando notificación async de creación de sucursal {}", codigoUnico);

        restClient.post()
                .uri("/api/auditoria/v1/eventos")
                .body(Map.of(
                        "tipo", "SUCURSAL_CREADA",
                        "codigoUnico", codigoUnico
                ))
                .retrieve()
                .toBodilessEntity();
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void tareaRecalculoIndicadores() {
        long total = sucursalRepository.count();
        log.info("Tarea programada: total de sucursales registradas = {}", total);
    }
}
