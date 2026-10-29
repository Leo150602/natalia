package com.proyect.main.repositorios;

import com.proyect.main.modelos.Documento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RepositorioDocumento extends JpaRepository<Documento, Integer> {
    boolean existsByNombre(String nombre);
}
