package com.proyect.main.modelos.dtos.entrada;

import com.proyect.main.modelos.enums.RolUsuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UsuarioAdminEditDto {
    private String username;
    private String password; 
    private String nombre;
    private RolUsuario rol;
    private String telefono;
    private String correo;
    private boolean activo;
    private Integer idPromotora;
}
