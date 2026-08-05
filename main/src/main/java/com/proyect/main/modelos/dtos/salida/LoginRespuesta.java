package com.proyect.main.modelos.dtos.salida;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoginRespuesta {
    private boolean succes; 
    private String mensaje;
    private Integer id;
    private String username;
    private String nombre;
    private String rol;
    private String telefono;
    private String correo;
    private Boolean activo;
    private Integer idPromotora;
    private String nombrePromotora;
}
