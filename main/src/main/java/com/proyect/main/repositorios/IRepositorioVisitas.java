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

    @Query("SELECT v FROM Visitas v JOIN FETCH v.tecnico JOIN FETCH v.incidencia i JOIN FETCH i.piso p JOIN FETCH p.promocion")
    List<Visitas> findAllWithDetails();

    @Query("SELECT v FROM Visitas v JOIN FETCH v.tecnico JOIN FETCH v.incidencia i JOIN FETCH i.piso p JOIN FETCH p.promocion WHERE v.idVisita = :id")
    Optional<Visitas> findByIdWithDetails(@Param("id") int id);

    @Query("SELECT v FROM Visitas v JOIN FETCH v.tecnico JOIN FETCH v.incidencia i JOIN FETCH i.piso p JOIN FETCH p.promocion prom " +
           "WHERE prom.idPromocion = :idPromocion ORDER BY v.diaVisita DESC")
    List<Visitas> findRecentByPromocionId(@Param("idPromocion") int idPromocion, Pageable pageable);

    @Query("SELECT v FROM Visitas v JOIN FETCH v.tecnico JOIN FETCH v.incidencia i JOIN FETCH i.piso p JOIN FETCH p.promocion prom " +
           "WHERE prom.idPromocion = :idPromocion")
    List<Visitas> findByPromocionId(@Param("idPromocion") int idPromocion);

    @Modifying
    @Transactional
    @Query("UPDATE Visitas v SET v.tecnico = null WHERE v.tecnico.idPersona = :idPersona")
    void setTecnicoToNull(@Param("idPersona") int idPersona);
}
