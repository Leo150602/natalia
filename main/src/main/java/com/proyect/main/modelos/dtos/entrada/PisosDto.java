package com.proyect.main.modelos.dtos.entrada;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class PisosDto {

    private String piso;
    private int idPromocion;
    private String propietarioNombre;
    private String propietarioTelefono;
    private Integer idPropietario;

}
