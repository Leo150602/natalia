package com.proyect.main.modelos.dtos.entrada;

import com.proyect.main.modelos.enums.EstadoVisita;
import lombok.*;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class VisitasDto {

    private String observaciones;
    private LocalDateTime diaVisita;
    private EstadoVisita estadoVisita;
    private int idTecnico;
    private String numeroIncidencia;

}
