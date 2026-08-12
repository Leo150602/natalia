package com.proyect.main;

import com.proyect.main.repositorios.IRepositorioPersonas;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final IRepositorioPersonas repositorioPersonas;

    @Override
    public void run(String... args) throws Exception {
        try {
            repositorioPersonas.clearAllPromotoras();
        } catch (Exception e) {
            System.err.println("Error al limpiar promotoras de personas en el arranque: " + e.getMessage());
        }
    }
}
