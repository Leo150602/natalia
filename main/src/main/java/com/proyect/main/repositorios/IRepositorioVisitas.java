package com.proyect.main.repositorios;

import com.proyect.main.modelos.Visitas;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface IRepositorioVisitas extends JpaRepository<Visitas, Integer> {

    @Query("SELECT v FROM Visitas v LEFT JOIN FETCH v.tecnico LEFT JOIN FETCH v.incidencia i LEFT JOIN FETCH i.piso ip LEFT JOIN FETCH ip.promocion LEFT JOIN FETCH v.piso p LEFT JOIN FETCH p.promocion")
    List<Visitas> findAllWithDetails();

    @Query("SELECT v FROM Visitas v LEFT JOIN FETCH v.tecnico LEFT JOIN FETCH v.incidencia i LEFT JOIN FETCH i.piso ip LEFT JOIN FETCH ip.promocion LEFT JOIN FETCH v.piso p LEFT JOIN FETCH p.promocion WHERE v.idVisita = :id")
    Optional<Visitas> findByIdWithDetails(@Param("id") int id);

    @Query("SELECT v FROM Visitas v LEFT JOIN FETCH v.tecnico LEFT JOIN FETCH v.incidencia i LEFT JOIN FETCH i.piso ip LEFT JOIN FETCH ip.promocion iprom LEFT JOIN FETCH v.piso p LEFT JOIN FETCH p.promocion prom " +
           "WHERE (prom.idPromocion = :idPromocion OR iprom.idPromocion = :idPromocion) ORDER BY v.diaVisita DESC")
    List<Visitas> findRecentByPromocionId(@Param("idPromocion") int idPromocion, Pageable pageable);

    @Query("SELECT v FROM Visitas v LEFT JOIN FETCH v.tecnico LEFT JOIN FETCH v.incidencia i LEFT JOIN FETCH i.piso ip LEFT JOIN FETCH ip.promocion iprom LEFT JOIN FETCH v.piso p LEFT JOIN FETCH p.promocion prom " +
           "WHERE (prom.idPromocion = :idPromocion OR iprom.idPromocion = :idPromocion)")
    List<Visitas> findByPromocionId(@Param("idPromocion") int idPromocion);

    @Query("SELECT v FROM Visitas v LEFT JOIN FETCH v.incidencia i LEFT JOIN FETCH i.piso LEFT JOIN FETCH v.piso")
    List<Visitas> findAllForMigration();

    @Modifying
    @Transactional
    @Query("UPDATE Visitas v SET v.tecnico = null WHERE v.tecnico.id = :idUsuario")
    void setTecnicoToNull(@Param("idUsuario") int idUsuario);

    @Modifying
    @Transactional
    @Query("DELETE FROM Visitas v WHERE v.incidencia.idIncidencia = :idIncidencia")
    void deleteByIncidenciaId(@Param("idIncidencia") int idIncidencia);

    @Modifying
    @Transactional
    @Query("DELETE FROM Visitas v WHERE v.piso.idPiso IN (SELECT p.idPiso FROM Pisos p WHERE p.promocion.idPromocion = :idPromocion) OR v.incidencia.idIncidencia IN (SELECT i.idIncidencia FROM Incidencias i WHERE i.piso.idPiso IN (SELECT p.idPiso FROM Pisos p WHERE p.promocion.idPromocion = :idPromocion))")
    void deleteByPromocionId(@Param("idPromocion") int idPromocion);

    @Modifying
    @Transactional
    @Query("DELETE FROM Visitas v WHERE v.piso.idPiso = :idPiso OR v.incidencia.idIncidencia IN (SELECT i.idIncidencia FROM Incidencias i WHERE i.piso.idPiso = :idPiso)")
    void deleteByPisoId(@Param("idPiso") int idPiso);
}
