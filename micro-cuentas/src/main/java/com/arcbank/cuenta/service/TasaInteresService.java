package com.arcbank.cuenta.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.arcbank.cuenta.dto.TasaInteresHistorialDTO;
import com.arcbank.cuenta.dto.TasaInteresHistorialRequest;
import com.arcbank.cuenta.model.TasaInteresHistorial;
import com.arcbank.cuenta.model.TipoCuentaAhorro;
import com.arcbank.cuenta.repository.TasaInteresHistorialRepository;
import com.arcbank.cuenta.repository.TipoCuentaAhorroRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TasaInteresService {

    private final TasaInteresHistorialRepository tasaRepo;
    private final TipoCuentaAhorroRepository tipoRepo;

    @Transactional
    public TasaInteresHistorialDTO create(TasaInteresHistorialRequest request) {
        TipoCuentaAhorro tipo = tipoRepo.findById(request.getIdTipoCuenta())
                .orElseThrow(() -> new EntityNotFoundException("TipoCuenta no encontrada: " + request.getIdTipoCuenta()));

        TasaInteresHistorial t = new TasaInteresHistorial();
        t.setTipoCuenta(tipo);
        t.setTasaInteresAnual(request.getTasaInteresAnual());
        t.setFechaInicio(request.getFechaInicio());
        t.setFechaFin(request.getFechaFin());

        log.info("Tasa de interés creada para tipo: {}", tipo.getNombre());
        return toDTO(tasaRepo.save(t));
    }

    public TasaInteresHistorialDTO findById(Integer id) {
        return tasaRepo.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new EntityNotFoundException("Tasa de interés no encontrada: " + id));
    }

    public List<TasaInteresHistorialDTO> findAll() {
        return tasaRepo.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Integer id) {
        if (!tasaRepo.existsById(id)) {
            throw new EntityNotFoundException("Tasa de interés no encontrada: " + id);
        }
        tasaRepo.deleteById(id);
        log.info("Tasa de interés eliminada: {}", id);
    }

    private TasaInteresHistorialDTO toDTO(TasaInteresHistorial t) {
        TasaInteresHistorialDTO dto = new TasaInteresHistorialDTO();
        dto.setIdTasaHistorial(t.getIdTasaHistorial());
        dto.setIdTipoCuenta(t.getTipoCuenta().getIdTipoCuenta());
        dto.setTasaInteresAnual(t.getTasaInteresAnual());
        dto.setFechaInicio(t.getFechaInicio());
        dto.setFechaFin(t.getFechaFin());
        return dto;
    }
}
