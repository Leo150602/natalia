package com.proyect.main;

import com.proyect.main.repositorios.IRepositorioPersonas;
import com.proyect.main.servicios.ServicioVisitas;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final IRepositorioPersonas repositorioPersonas;
    private final ServicioVisitas servicioVisitas;

    @Override
    public void run(String... args) throws Exception {
        try {
            repositorioPersonas.clearAllPromotoras();
        } catch (Exception e) {
            System.err.println("Error al limpiar promotoras de personas en el arranque: " + e.getMessage());
        }

        try {
            int migradas = servicioVisitas.migrarPisosDesdeIncidencias();
            if (migradas > 0) {
                System.out.println("Visitas migradas exitosamente con relación directa al piso: " + migradas);
            }
        } catch (Exception e) {
            System.err.println("Error al migrar pisos de visitas en el arranque: " + e.getMessage());
        }
    }
}
