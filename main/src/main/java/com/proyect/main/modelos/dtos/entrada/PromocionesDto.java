package com.proyect.main.modelos.dtos.entrada;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class PromocionesDto {

    private String promotora;
    private String promocion;
    private String direccion;
    private String coordenadas;
}
