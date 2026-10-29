package com.proyect.main.repositorios;

import com.proyect.main.modelos.IncidenciaDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RepositorioIncidenciaDocumento extends JpaRepository<IncidenciaDocumento, Integer> {
    List<IncidenciaDocumento> findByIncidenciaIdIncidencia(int idIncidencia);
}
