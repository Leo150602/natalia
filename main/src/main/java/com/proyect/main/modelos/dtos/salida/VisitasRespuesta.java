package com.proyect.main.modelos.dtos.salida;

import lombok.*;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class VisitasRespuesta {

    private int idVisita;
    private String observaciones;
    private LocalDateTime diaVisita;
    private String estadoVisita;
    private String tecnicoNombre;
    private String tecnicoTelefono;
    private String numeroIncidencia;
    private int idIncidencia;
    private String piso;
    private String promocion;
    private String propietario;
    private String telefonoPropietario;

}
