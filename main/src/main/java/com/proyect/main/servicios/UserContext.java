package com.proyect.main.servicios;

import com.proyect.main.modelos.Usuario;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class UserContext {

    public static Usuario getCurrentUsuario() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Usuario) {
            return (Usuario) auth.getPrincipal();
        }
        return null;
    }

    public static boolean puedeInsertarEditar() {
        Usuario usuario = getCurrentUsuario();
        if (usuario == null) {
            return false;
        }
        return com.proyect.main.modelos.enums.RolUsuario.DESARROLLADOR.equals(usuario.getRol()) || usuario.getId() == 2;
    }

    public static boolean puedeAdministrarUsuarios() {
        Usuario usuario = getCurrentUsuario();
        if (usuario == null) {
            return false;
        }
        return com.proyect.main.modelos.enums.RolUsuario.DESARROLLADOR.equals(usuario.getRol())
                || com.proyect.main.modelos.enums.RolUsuario.ADMINISTRADOR.equals(usuario.getRol())
                || usuario.getId() == 2;
    }
}
