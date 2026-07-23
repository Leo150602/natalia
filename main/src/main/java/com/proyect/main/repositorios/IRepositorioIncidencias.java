package com.proyect.main.repositorios;

import com.proyect.main.modelos.Incidencias;
import com.proyect.main.modelos.enums.CategoriaIncidencia;
import com.proyect.main.modelos.enums.EstadoIncidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IRepositorioIncidencias extends JpaRepository<Incidencias, String> {

    @Query("SELECT i FROM Incidencias i JOIN FETCH i.piso p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH p.propietario")
    List<Incidencias> findAllWithDetails();

    @Query("SELECT i FROM Incidencias i JOIN FETCH i.piso p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH p.propietario WHERE i.numeroIncidencia = :id")
    Optional<Incidencias> findByIdWithDetails(@Param("id") String id);

    @Query("SELECT i FROM Incidencias i JOIN FETCH i.piso p JOIN FETCH p.promocion prom JOIN FETCH p.propietario prop " +
           "WHERE (:numeroIncidencia IS NULL OR :numeroIncidencia = '' OR i.numeroIncidencia = :numeroIncidencia) " +
           "AND (:piso IS NULL OR :piso = '' OR p.piso LIKE CONCAT('%', :piso, '%')) " +
           "AND (:promocion IS NULL OR :promocion = '' OR prom.promocion LIKE CONCAT('%', :promocion, '%')) " +
           "AND (:fechaInicial IS NULL OR i.fechaIncidencia >= :fechaInicial) " +
           "AND (:fechaFinal IS NULL OR i.fechaIncidencia <= :fechaFinal) " +
           "AND (:estadoIncidencia IS NULL OR i.estadoIncidencia = :estadoIncidencia) " +
           "AND (:categoriaIncidencia IS NULL OR i.categoriaIncidencia = :categoriaIncidencia)")
    List<Incidencias> filtrarIncidencias(
        @Param("numeroIncidencia") String numeroIncidencia,
        @Param("piso") String piso,
        @Param("promocion") String promocion,
        @Param("fechaInicial") LocalDateTime fechaInicial,
        @Param("fechaFinal") LocalDateTime fechaFinal,
        @Param("estadoIncidencia") EstadoIncidencia estadoIncidencia,
        @Param("categoriaIncidencia") CategoriaIncidencia categoriaIncidencia
    );

    @Query("SELECT i FROM Incidencias i JOIN FETCH i.piso p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH p.propietario prop WHERE prom.idPromocion = :idPromocion")
    List<Incidencias> findByPromocionId(@Param("idPromocion") int idPromocion);

    @Query("SELECT COUNT(i) FROM Incidencias i WHERE i.piso.promocion.idPromocion = :idPromocion")
    long countByPromocionId(@Param("idPromocion") int idPromocion);
}
