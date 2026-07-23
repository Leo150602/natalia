package com.proyect.main.repositorios;

import com.proyect.main.modelos.Pisos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface IRepositorioPisos extends JpaRepository<Pisos, Integer> {

    @Query("SELECT p FROM Pisos p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH p.propietario")
    List<Pisos> findAllPisos();

    @Query("SELECT p FROM Pisos p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH p.propietario WHERE p.idPiso = :id")
    Optional<Pisos> findByIdWithDetails(@Param("id") int id);

    Optional<Pisos> findByPisoAndPromocion_Promocion(String piso, String promocion);

    @Query("SELECT p FROM Pisos p JOIN FETCH p.promocion prom JOIN FETCH prom.promotora LEFT JOIN FETCH p.propietario WHERE prom.idPromocion = :idPromocion")
    List<Pisos> findByPromocionId(@Param("idPromocion") int idPromocion);

    @Query("SELECT p FROM Pisos p WHERE p.piso = :piso AND p.promocion.idPromocion = :idPromocion")
    Optional<Pisos> findByPisoAndPromocionId(@Param("piso") String piso, @Param("idPromocion") int idPromocion);

    long countByPromocion_IdPromocion(int idPromocion);

    @Modifying
    @Transactional
    @Query("UPDATE Pisos p SET p.propietario = null WHERE p.propietario.idPersona = :idPersona")
    void setPropietarioToNull(@Param("idPersona") int idPersona);
}
