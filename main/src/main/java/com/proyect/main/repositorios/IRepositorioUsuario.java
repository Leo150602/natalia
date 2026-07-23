package com.proyect.main.repositorios;

import com.proyect.main.modelos.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IRepositorioUsuario extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByUsername(String username);
}
