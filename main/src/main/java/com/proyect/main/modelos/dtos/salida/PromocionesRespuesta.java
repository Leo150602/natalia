package com.proyect.main.modelos.dtos.salida;

import lombok.*;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class PromocionesRespuesta {

    private String promotora;
    private List<PromocionItem> promocion;

}
