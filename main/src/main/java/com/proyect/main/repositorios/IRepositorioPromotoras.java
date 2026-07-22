package com.proyect.main.repositorios;

import com.proyect.main.modelos.Promotoras;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface IRepositorioPromotoras extends JpaRepository<Promotoras, Integer> {
    Optional<Promotoras> findByPromotora(String promotora);
}
