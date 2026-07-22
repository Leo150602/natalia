package com.proyect.main.modelos.dtos.salida;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class PisosRespuesta {

    private Integer idPiso;
    private String promocion;
    private String piso;
    private String propietario;
    private String telefonoPropietario;

}
