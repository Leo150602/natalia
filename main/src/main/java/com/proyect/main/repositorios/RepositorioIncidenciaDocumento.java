package com.proyect.main.repositorios;

import com.proyect.main.modelos.IncidenciaDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface RepositorioIncidenciaDocumento extends JpaRepository<IncidenciaDocumento, Integer> {
    List<IncidenciaDocumento> findByIncidenciaIdIncidencia(int idIncidencia);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM IncidenciaDocumento id WHERE id.incidencia.idIncidencia = :idIncidencia")
    void deleteByIncidenciaId(@Param("idIncidencia") int idIncidencia);
}
