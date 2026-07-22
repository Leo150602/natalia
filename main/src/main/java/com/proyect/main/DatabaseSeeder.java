package com.proyect.main;

import com.proyect.main.modelos.Promociones;
import com.proyect.main.modelos.Promotoras;
import com.proyect.main.repositorios.IRepositorioPromociones;
import com.proyect.main.repositorios.IRepositorioPromotoras;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final IRepositorioPromotoras repositorioPromotoras;
    private final IRepositorioPromociones repositorioPromociones;

    @Override
    public void run(String... args) throws Exception {
        if (repositorioPromotoras.count() == 0) {
            // Promotora 1
            Promotoras p1 = repositorioPromotoras.save(
                    Promotoras.builder().promotora("Promotora Alborán").build()
            );
            repositorioPromociones.save(
                    Promociones.builder().promocion("Residencial Marina").promotora(p1).build()
            );
            repositorioPromociones.save(
                    Promociones.builder().promocion("Altos del Mediterráneo").promotora(p1).build()
            );

            // Promotora 2
            Promotoras p2 = repositorioPromotoras.save(
                    Promotoras.builder().promotora("Promociones del Sur").build()
            );
            repositorioPromociones.save(
                    Promociones.builder().promocion("Jardines del Sol").promotora(p2).build()
            );
            repositorioPromociones.save(
                    Promociones.builder().promocion("Vista Bella").promotora(p2).build()
            );

            System.out.println(">> BASE DE DATOS INICIALIZADA CON PROMOTORAS Y PROMOCIONES DE PRUEBA.");
        }
    }
}
