package com.proyect.main.modelos.dtos.entrada;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ActualizarUsuarioDto {
    private String nombre;
    private String correo;
    private String telefono;
}
