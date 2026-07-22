package com.proyect.main.modelos.dtos.entrada;

import com.proyect.main.modelos.enums.CategoriaIncidencia;
import com.proyect.main.modelos.enums.EstadoIncidencia;
import lombok.*;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class IncidenciasFiltroDto {

    private String numeroIncidencia;
    private String piso;
    private String promocion;
    private LocalDateTime fechaInicial;
    private LocalDateTime fechaFinal;
    private EstadoIncidencia estadoIncidencia;
    private CategoriaIncidencia categoriaIncidencia;

}
