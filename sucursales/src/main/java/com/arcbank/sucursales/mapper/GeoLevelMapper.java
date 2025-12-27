package com.arcbank.sucursales.mapper;

import com.arcbank.sucursales.dto.request.SucursalRequest;
import com.arcbank.sucursales.dto.response.SucursalDTO;
import com.arcbank.sucursales.model.Sucursal;

public interface GeoLevelMapper {

    Sucursal toEntity(SucursalRequest request);

    SucursalDTO toDTO(Sucursal sucursal);
}
