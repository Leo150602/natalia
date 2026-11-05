package com.proyect.main;

import com.proyect.main.repositorios.IRepositorioPersonas;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final IRepositorioPersonas repositorioPersonas;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            repositorioPersonas.clearAllPromotoras();
        } catch (Exception e) {
            System.err.println("Error al limpiar promotoras de personas en el arranque: " + e.getMessage());
        }

        try {
            configurarForeignKeysConCascade();
        } catch (Exception e) {
            System.err.println("Advertencia al configurar ON DELETE CASCADE en llaves foráneas: " + e.getMessage());
        }
    }

    private void configurarForeignKeysConCascade() {
        String sql = """
            DO $$
            DECLARE
                r RECORD;
            BEGIN
                -- 1. pisos -> promociones (id_promocion)
                FOR r IN (
                    SELECT tc.constraint_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                      AND tc.table_name = 'pisos'
                      AND kcu.column_name = 'id_promocion'
                ) LOOP
                    EXECUTE 'ALTER TABLE pisos DROP CONSTRAINT ' || quote_ident(r.constraint_name);
                END LOOP;
                ALTER TABLE pisos
                ADD CONSTRAINT fk_pisos_promocion
                FOREIGN KEY (id_promocion) REFERENCES promociones(id_promocion) ON DELETE CASCADE;

                -- 2. incidencias -> pisos (id_piso)
                FOR r IN (
                    SELECT tc.constraint_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                      AND tc.table_name = 'incidencias'
                      AND kcu.column_name = 'id_piso'
                ) LOOP
                    EXECUTE 'ALTER TABLE incidencias DROP CONSTRAINT ' || quote_ident(r.constraint_name);
                END LOOP;
                ALTER TABLE incidencias
                ADD CONSTRAINT fk_incidencias_piso
                FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE;

                -- 3. visitas -> pisos (id_piso)
                FOR r IN (
                    SELECT tc.constraint_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                      AND tc.table_name = 'visitas'
                      AND kcu.column_name = 'id_piso'
                ) LOOP
                    EXECUTE 'ALTER TABLE visitas DROP CONSTRAINT ' || quote_ident(r.constraint_name);
                END LOOP;
                ALTER TABLE visitas
                ADD CONSTRAINT fk_visitas_piso
                FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE;

                -- 4. incidencia_documentos -> incidencias (id_incidencia)
                FOR r IN (
                    SELECT tc.constraint_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                      AND tc.table_name = 'incidencia_documentos'
                      AND kcu.column_name = 'id_incidencia'
                ) LOOP
                    EXECUTE 'ALTER TABLE incidencia_documentos DROP CONSTRAINT ' || quote_ident(r.constraint_name);
                END LOOP;
                ALTER TABLE incidencia_documentos
                ADD CONSTRAINT fk_incidencia_documentos_incidencia
                FOREIGN KEY (id_incidencia) REFERENCES incidencias(id_incidencia) ON DELETE CASCADE;
            END $$;
            """;
        jdbcTemplate.execute(sql);
    }
}
