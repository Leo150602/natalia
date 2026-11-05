package com.proyect.main.repositorios;

import com.proyect.main.modelos.Promociones;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface IRepositorioPromociones extends JpaRepository<Promociones, Integer> {

    Optional<Promociones> findByPromocion(String promocion);

    @Query("SELECT p FROM Promociones p JOIN FETCH p.promotora")
    List<Promociones> findAllWithPromotora();

    @Query("SELECT p FROM Promociones p JOIN FETCH p.promotora WHERE p.idPromocion = :id")
    Optional<Promociones> findByIdWithPromotora(@Param("id") int id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM Promociones p WHERE p.idPromocion = :idPromocion")
    void deleteByIdPromocion(@Param("idPromocion") int idPromocion);
}
