package com.proyect.main;

import com.proyect.main.modelos.Promociones;
import com.proyect.main.modelos.Promotoras;
import com.proyect.main.modelos.Usuario;
import com.proyect.main.repositorios.IRepositorioPromociones;
import com.proyect.main.repositorios.IRepositorioPromotoras;
import com.proyect.main.repositorios.IRepositorioUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final IRepositorioPromotoras repositorioPromotoras;
    private final IRepositorioPromociones repositorioPromociones;
    private final IRepositorioUsuario repositorioUsuario;

    @Override
    public void run(String... args) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        if (repositorioUsuario.findByUsername("admin").isEmpty()) {
            repositorioUsuario.save(Usuario.builder()
                    .username("admin")
                    .password(encoder.encode("admin"))
                    .nombre("Odecor Posventa Admin")
                    .rol("ADMIN")
                    .build());
        }
        
        if (repositorioUsuario.findByUsername("tecnico").isEmpty()) {
            repositorioUsuario.save(Usuario.builder()
                    .username("tecnico")
                    .password(encoder.encode("tecnico"))
                    .nombre("Técnico Odecor")
                    .rol("TECNICO")
                    .build());
        }

        if (repositorioUsuario.findByUsername("admin1").isEmpty()) {
            repositorioUsuario.save(Usuario.builder()
                    .username("admin1")
                    .password(encoder.encode("12345678"))
                    .nombre("Administrador Temporal")
                    .rol("ADMIN")
                    .build());
            System.out.println(">> USUARIO TEMPORAL admin1 CREADO.");
        }

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
