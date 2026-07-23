package com.proyect.main.servicios;

import com.proyect.main.modelos.Usuario;
import com.proyect.main.modelos.dtos.entrada.LoginDto;
import com.proyect.main.modelos.dtos.salida.LoginRespuesta;
import com.proyect.main.repositorios.IRepositorioUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ServicioUsuario {

    private final IRepositorioUsuario repositorioUsuario;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public LoginRespuesta login(LoginDto dto) {
        Optional<Usuario> usuarioOpt = repositorioUsuario.findByUsername(dto.getUsername());
        
        if (usuarioOpt.isEmpty()) {
            return LoginRespuesta.builder()
                    .succes(false)
                    .mensaje("Usuario no encontrado")
                    .build();
        }

        Usuario usuario = usuarioOpt.get();

        if (!passwordEncoder.matches(dto.getPassword(), usuario.getPassword())) {
            return LoginRespuesta.builder()
                    .succes(false)
                    .mensaje("Contraseña incorrecta")
                    .build();
        }

        return LoginRespuesta.builder()
                .succes(true)
                .mensaje("Login exitoso")
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombre(usuario.getNombre())
                .rol(usuario.getRol())
                .build();
    }

    public Usuario registrar(Usuario usuario) {
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return repositorioUsuario.save(usuario);
    }
}
