package com.proyect.main.modelos.dtos.salida;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class PersonasRespuesta {

    private int idPersona;
    private String nombre;
    private String telefono;
    private String tipoPersonas;
    private Integer idPromotora;
    private String nombrePromotora;

}
