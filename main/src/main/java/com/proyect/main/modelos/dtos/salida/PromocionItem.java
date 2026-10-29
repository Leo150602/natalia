package com.proyect.main.modelos.dtos.salida;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class PromocionItem {
    private Integer idPromocion;
    private String nombre;
    private String direccion;
    private String coordenadas;
    private String color;
}
