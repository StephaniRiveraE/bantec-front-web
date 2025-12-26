package com.arcbank.cuenta.service;

import com.arcbank.cuenta.dto.TipoCuentaAhorroRequest;
import com.arcbank.cuenta.dto.TipoCuentaAhorroDTO;
import com.arcbank.cuenta.model.TipoCuentaAhorro;
import com.arcbank.cuenta.repository.TipoCuentaAhorroRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TipoCuentaService {

    private final TipoCuentaAhorroRepository tipoRepo;

    @Transactional
    public TipoCuentaAhorroDTO create(TipoCuentaAhorroRequest request) {
        TipoCuentaAhorro t = new TipoCuentaAhorro();
        t.setNombre(request.getNombre());
        t.setDescripcion(request.getDescripcion());
        t.setTasaInteresMaxima(request.getTasaInteresMaxima());
        t.setAmortizacion(request.getAmortizacion());
        t.setActivo(request.getActivo());

        log.info("Tipo de cuenta creada: {}", t.getNombre());
        return toDTO(tipoRepo.save(t));
    }

    @Transactional
    public TipoCuentaAhorroDTO update(Integer id, TipoCuentaAhorroRequest request) {
        TipoCuentaAhorro t = tipoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tipo de cuenta no encontrado: " + id));
        
        t.setNombre(request.getNombre());
        t.setDescripcion(request.getDescripcion());
        t.setTasaInteresMaxima(request.getTasaInteresMaxima());
        t.setAmortizacion(request.getAmortizacion());
        t.setActivo(request.getActivo());
        
        log.info("Tipo de cuenta actualizada: {}", id);
        return toDTO(tipoRepo.save(t));
    }

    public TipoCuentaAhorroDTO findById(Integer id) {
        return tipoRepo.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new EntityNotFoundException("Tipo de cuenta no encontrado: " + id));
    }

    public List<TipoCuentaAhorroDTO> findAll() {
        return tipoRepo.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Integer id) {
        if (!tipoRepo.existsById(id)) {
            throw new EntityNotFoundException("Tipo de cuenta no encontrado: " + id);
        }
        tipoRepo.deleteById(id);
        log.info("Tipo de cuenta eliminada: {}", id);
    }

    private TipoCuentaAhorroDTO toDTO(TipoCuentaAhorro t) {
        TipoCuentaAhorroDTO dto = new TipoCuentaAhorroDTO();
        dto.setIdTipoCuenta(t.getIdTipoCuenta());
        dto.setNombre(t.getNombre());
        dto.setDescripcion(t.getDescripcion());
        dto.setTasaInteresMaxima(t.getTasaInteresMaxima());
        dto.setAmortizacion(t.getAmortizacion());
        dto.setActivo(t.getActivo());
        return dto;
    }
}
