package com.proyect.main.repositorios;

import com.proyect.main.modelos.Personas;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface IRepositorioPersonas extends JpaRepository<Personas, Integer> {
    Optional<Personas> findByTelefono(String telefono);

    @Query("SELECT DISTINCT p.propietario FROM Pisos p WHERE p.promocion.idPromocion = :idPromocion AND p.propietario IS NOT NULL")
    List<Personas> findOwnersByPromocionId(@Param("idPromocion") int idPromocion);

    @Modifying
    @Transactional
    @Query("UPDATE Personas p SET p.promotora = null")
    void clearAllPromotoras();
}
