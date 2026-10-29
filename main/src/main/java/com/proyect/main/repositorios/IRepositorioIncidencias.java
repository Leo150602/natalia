package com.proyect.main.repositorios;

import com.proyect.main.modelos.Incidencias;
import com.proyect.main.modelos.enums.CategoriaIncidencia;
import com.proyect.main.modelos.enums.EstadoIncidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IRepositorioIncidencias extends JpaRepository<Incidencias, Integer> {

    @Query("SELECT i FROM Incidencias i JOIN FETCH i.piso p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH p.propietario WHERE i.estadoIncidencia IS NULL OR (i.estadoIncidencia <> com.proyect.main.modelos.enums.EstadoIncidencia.SOLICITADO AND i.estadoIncidencia <> com.proyect.main.modelos.enums.EstadoIncidencia.RECHAZADO)")
    List<Incidencias> findAllWithDetails();

    @Query("SELECT i FROM Incidencias i JOIN FETCH i.piso p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH p.propietario WHERE i.idIncidencia = :id")
    Optional<Incidencias> findByIdWithDetails(@Param("id") int id);

    @Query("SELECT i FROM Incidencias i JOIN i.piso p WHERE i.numeroIncidencia = :numeroIncidencia AND p.promocion.idPromocion = :idPromocion")
    Optional<Incidencias> findByNumeroIncidenciaAndPromocionId(@Param("numeroIncidencia") String numeroIncidencia, @Param("idPromocion") int idPromocion);

    @Query("SELECT i FROM Incidencias i JOIN i.piso p JOIN p.promocion prom JOIN prom.promotora promo " +
           "WHERE i.numeroIncidencia = :numeroIncidencia AND promo.idPromotora = :idPromotora")
    List<Incidencias> findByNumeroIncidenciaAndPromotoraId(
        @Param("numeroIncidencia") String numeroIncidencia, 
        @Param("idPromotora") int idPromotora
    );

    @Query("SELECT i FROM Incidencias i JOIN FETCH i.piso p JOIN FETCH p.promocion prom JOIN FETCH p.propietario prop " +
           "WHERE (:numeroIncidencia IS NULL OR :numeroIncidencia = '' OR i.numeroIncidencia = :numeroIncidencia) " +
           "AND (:piso IS NULL OR :piso = '' OR p.piso LIKE CONCAT('%', :piso, '%')) " +
           "AND (:promocion IS NULL OR :promocion = '' OR prom.promocion LIKE CONCAT('%', :promocion, '%')) " +
           "AND (:fechaInicial IS NULL OR i.fechaIncidencia >= :fechaInicial) " +
           "AND (:fechaFinal IS NULL OR i.fechaIncidencia <= :fechaFinal) " +
           "AND (:estadoIncidencia IS NULL OR i.estadoIncidencia = :estadoIncidencia) " +
           "AND (:categoriaIncidencia IS NULL OR i.categoriaIncidencia = :categoriaIncidencia) " +
           "AND (i.estadoIncidencia IS NULL OR (i.estadoIncidencia <> com.proyect.main.modelos.enums.EstadoIncidencia.SOLICITADO AND i.estadoIncidencia <> com.proyect.main.modelos.enums.EstadoIncidencia.RECHAZADO))")
    List<Incidencias> filtrarIncidencias(
        @Param("numeroIncidencia") String numeroIncidencia,
        @Param("piso") String piso,
        @Param("promocion") String promocion,
        @Param("fechaInicial") LocalDateTime fechaInicial,
        @Param("fechaFinal") LocalDateTime fechaFinal,
        @Param("estadoIncidencia") EstadoIncidencia estadoIncidencia,
        @Param("categoriaIncidencia") CategoriaIncidencia categoriaIncidencia
    );

    @Query("SELECT i FROM Incidencias i JOIN FETCH i.piso p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH p.propietario prop WHERE prom.idPromocion = :idPromocion AND (i.estadoIncidencia IS NULL OR (i.estadoIncidencia <> com.proyect.main.modelos.enums.EstadoIncidencia.SOLICITADO AND i.estadoIncidencia <> com.proyect.main.modelos.enums.EstadoIncidencia.RECHAZADO))")
    List<Incidencias> findByPromocionId(@Param("idPromocion") int idPromocion);

    @Query("SELECT i FROM Incidencias i JOIN FETCH i.piso p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH p.propietario prop WHERE prom.idPromocion = :idPromocion")
    List<Incidencias> findByPromocionIdAllStates(@Param("idPromocion") int idPromocion);

    @Query("SELECT COUNT(i) FROM Incidencias i WHERE i.piso.promocion.idPromocion = :idPromocion AND (i.estadoIncidencia IS NULL OR (i.estadoIncidencia <> com.proyect.main.modelos.enums.EstadoIncidencia.SOLICITADO AND i.estadoIncidencia <> com.proyect.main.modelos.enums.EstadoIncidencia.RECHAZADO))")
    long countByPromocionId(@Param("idPromocion") int idPromocion);

    @Query("SELECT i FROM Incidencias i JOIN FETCH i.piso p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH i.usuarioActualizo LEFT JOIN FETCH p.propietario WHERE i.estadoIncidencia = com.proyect.main.modelos.enums.EstadoIncidencia.SOLICITADO AND (:idPromocion IS NULL OR prom.idPromocion = :idPromocion)")
    List<Incidencias> findSolicitudes(@Param("idPromocion") Integer idPromocion);

    @Query("SELECT i.idIncidencia FROM Incidencias i WHERE i.piso.promocion.idPromocion = :idPromocion")
    List<Integer> findIdsByPromocionId(@Param("idPromocion") int idPromocion);

    @Query("SELECT i.idIncidencia FROM Incidencias i WHERE i.piso.idPiso = :idPiso")
    List<Integer> findIdsByPisoId(@Param("idPiso") int idPiso);

    @Modifying
    @Transactional
    @Query("DELETE FROM Incidencias i WHERE i.piso.idPiso IN (SELECT p.idPiso FROM Pisos p WHERE p.promocion.idPromocion = :idPromocion)")
    void deleteByPromocionId(@Param("idPromocion") int idPromocion);

    @Modifying
    @Transactional
    @Query("DELETE FROM Incidencias i WHERE i.piso.idPiso = :idPiso")
    void deleteByPisoId(@Param("idPiso") int idPiso);
}
