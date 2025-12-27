package com.arcbank.sucursales.repository;

import com.arcbank.sucursales.model.Sucursal;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SucursalRepository extends MongoRepository<Sucursal, String> {

    Optional<Sucursal> findByCodigoUnico(String codigoUnico);


    List<Sucursal> findByUbicacion_Provincia_Nombre(String provincia);


    List<Sucursal> findByUbicacion_Canton_Nombre(String canton);


    List<Sucursal> findByUbicacion_Parroquia_Nombre(String parroquia);
}
