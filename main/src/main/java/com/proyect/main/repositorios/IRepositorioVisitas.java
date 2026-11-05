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

    @Query("SELECT v FROM Visitas v LEFT JOIN FETCH v.tecnico JOIN FETCH v.piso p JOIN FETCH p.promocion LEFT JOIN FETCH p.propietario")
    List<Visitas> findAllWithDetails();

    @Query("SELECT v FROM Visitas v LEFT JOIN FETCH v.tecnico JOIN FETCH v.piso p JOIN FETCH p.promocion LEFT JOIN FETCH p.propietario WHERE v.idVisita = :id")
    Optional<Visitas> findByIdWithDetails(@Param("id") int id);

    @Query("SELECT v FROM Visitas v LEFT JOIN FETCH v.tecnico JOIN FETCH v.piso p JOIN FETCH p.promocion prom LEFT JOIN FETCH p.propietario " +
           "WHERE prom.idPromocion = :idPromocion ORDER BY v.diaVisita DESC")
    List<Visitas> findRecentByPromocionId(@Param("idPromocion") int idPromocion, Pageable pageable);

    @Query("SELECT v FROM Visitas v LEFT JOIN FETCH v.tecnico JOIN FETCH v.piso p JOIN FETCH p.promocion prom LEFT JOIN FETCH p.propietario " +
           "WHERE prom.idPromocion = :idPromocion")
    List<Visitas> findByPromocionId(@Param("idPromocion") int idPromocion);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("UPDATE Visitas v SET v.tecnico = null WHERE v.tecnico.id = :idUsuario")
    void setTecnicoToNull(@Param("idUsuario") int idUsuario);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM Visitas v WHERE v.piso.idPiso IN (SELECT p.idPiso FROM Pisos p WHERE p.promocion.idPromocion = :idPromocion)")
    void deleteByPromocionId(@Param("idPromocion") int idPromocion);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM Visitas v WHERE v.piso.idPiso = :idPiso")
    void deleteByPisoId(@Param("idPiso") int idPiso);
}
