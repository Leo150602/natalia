package com.proyect.main.modelos.dtos.entrada;

import com.proyect.main.modelos.enums.TipoPersonas;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class PersonasDto {

    private String nombre;
    private String telefono;
    private TipoPersonas tipoPersonas;
    private Integer idPromotora;

}
