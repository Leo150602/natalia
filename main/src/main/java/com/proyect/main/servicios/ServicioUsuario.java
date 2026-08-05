package com.proyect.main.servicios;

import com.proyect.main.modelos.Usuario;
import com.proyect.main.modelos.Promotoras;
import com.proyect.main.modelos.dtos.entrada.LoginDto;
import com.proyect.main.modelos.dtos.entrada.UsuarioAdminRegistroDto;
import com.proyect.main.modelos.dtos.entrada.UsuarioAdminEditDto;
import com.proyect.main.modelos.dtos.salida.LoginRespuesta;
import com.proyect.main.modelos.enums.RolUsuario;
import com.proyect.main.repositorios.IRepositorioUsuario;
import com.proyect.main.repositorios.IRepositorioPromotoras;
import com.proyect.main.repositorios.IRepositorioVisitas;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ServicioUsuario {

    private final IRepositorioUsuario repositorioUsuario;
    private final IRepositorioPromotoras repositorioPromotoras;
    private final IRepositorioVisitas repositorioVisitas;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public static Usuario getUsuarioLogeado() {
        return UserContext.getCurrentUsuario();
    }

    public LoginRespuesta login(LoginDto dto) {
        Optional<Usuario> usuarioOpt = repositorioUsuario.findByUsername(dto.getUsername());
        
        if (usuarioOpt.isEmpty()) {
            return LoginRespuesta.builder()
                    .succes(false)
                    .mensaje("Usuario no encontrado")
                    .build();
        }

        Usuario usuario = usuarioOpt.get();

        if (!usuario.isActivo()) {
            return LoginRespuesta.builder()
                    .succes(false)
                    .mensaje("El usuario está inactivo")
                    .build();
        }

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
                .rol(usuario.getRol() != null ? usuario.getRol().name() : null)
                .telefono(usuario.getTelefono())
                .correo(usuario.getCorreo())
                .activo(usuario.isActivo())
                .idPromotora(usuario.getPromotora() != null ? usuario.getPromotora().getIdPromotora() : null)
                .nombrePromotora(usuario.getPromotora() != null ? usuario.getPromotora().getPromotora() : null)
                .build();
    }

    public LoginRespuesta obtenerPorId(int id) {
        Usuario usuario = repositorioUsuario.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return LoginRespuesta.builder()
                .succes(true)
                .mensaje("Usuario encontrado")
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombre(usuario.getNombre())
                .rol(usuario.getRol() != null ? usuario.getRol().name() : null)
                .telefono(usuario.getTelefono())
                .correo(usuario.getCorreo())
                .activo(usuario.isActivo())
                .idPromotora(usuario.getPromotora() != null ? usuario.getPromotora().getIdPromotora() : null)
                .nombrePromotora(usuario.getPromotora() != null ? usuario.getPromotora().getPromotora() : null)
                .build();
    }

    public LoginRespuesta actualizar(int id, com.proyect.main.modelos.dtos.entrada.ActualizarUsuarioDto dto) {
        Usuario usuario = repositorioUsuario.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        usuario.setNombre(dto.getNombre());
        usuario.setCorreo(dto.getCorreo());
        usuario.setTelefono(dto.getTelefono());
        
        repositorioUsuario.save(usuario);
        
        return LoginRespuesta.builder()
                .succes(true)
                .mensaje("Usuario actualizado con éxito")
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombre(usuario.getNombre())
                .rol(usuario.getRol() != null ? usuario.getRol().name() : null)
                .telefono(usuario.getTelefono())
                .correo(usuario.getCorreo())
                .activo(usuario.isActivo())
                .idPromotora(usuario.getPromotora() != null ? usuario.getPromotora().getIdPromotora() : null)
                .nombrePromotora(usuario.getPromotora() != null ? usuario.getPromotora().getPromotora() : null)
                .build();
    }

    public LoginRespuesta cambiarPassword(int id, com.proyect.main.modelos.dtos.entrada.CambiarPasswordDto dto) {
        Usuario usuario = repositorioUsuario.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(dto.getOldPassword(), usuario.getPassword())) {
            return LoginRespuesta.builder()
                    .succes(false)
                    .mensaje("La contraseña actual es incorrecta")
                    .build();
        }

        usuario.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        repositorioUsuario.save(usuario);

        return LoginRespuesta.builder()
                .succes(true)
                .mensaje("Contraseña actualizada con éxito")
                .build();
    }

    public List<LoginRespuesta> listarTodos() {
        return repositorioUsuario.findAll().stream()
                .filter(usuario -> usuario.getRol() != com.proyect.main.modelos.enums.RolUsuario.CLIENTE)
                .map(usuario -> LoginRespuesta.builder()
                        .succes(true)
                        .id(usuario.getId())
                        .username(usuario.getUsername())
                        .nombre(usuario.getNombre())
                        .rol(usuario.getRol() != null ? usuario.getRol().name() : null)
                        .telefono(usuario.getTelefono())
                        .correo(usuario.getCorreo())
                        .activo(usuario.isActivo())
                        .idPromotora(usuario.getPromotora() != null ? usuario.getPromotora().getIdPromotora() : null)
                        .nombrePromotora(usuario.getPromotora() != null ? usuario.getPromotora().getPromotora() : null)
                        .build())
                .collect(Collectors.toList());
    }

    public List<LoginRespuesta> listarClientes() {
        return repositorioUsuario.findAll().stream()
                .filter(usuario -> usuario.getRol() == com.proyect.main.modelos.enums.RolUsuario.CLIENTE)
                .map(usuario -> LoginRespuesta.builder()
                        .succes(true)
                        .id(usuario.getId())
                        .username(usuario.getUsername())
                        .nombre(usuario.getNombre())
                        .rol(usuario.getRol() != null ? usuario.getRol().name() : null)
                        .telefono(usuario.getTelefono())
                        .correo(usuario.getCorreo())
                        .activo(usuario.isActivo())
                        .idPromotora(usuario.getPromotora() != null ? usuario.getPromotora().getIdPromotora() : null)
                        .nombrePromotora(usuario.getPromotora() != null ? usuario.getPromotora().getPromotora() : null)
                        .build())
                .collect(Collectors.toList());
    }

    public List<LoginRespuesta> listarTecnicos() {
        return repositorioUsuario.findAll().stream()
                .filter(usuario -> usuario.getRol() == com.proyect.main.modelos.enums.RolUsuario.TECNICO)
                .map(usuario -> LoginRespuesta.builder()
                        .succes(true)
                        .id(usuario.getId())
                        .username(usuario.getUsername())
                        .nombre(usuario.getNombre())
                        .rol(usuario.getRol() != null ? usuario.getRol().name() : null)
                        .telefono(usuario.getTelefono())
                        .correo(usuario.getCorreo())
                        .activo(usuario.isActivo())
                        .build())
                .collect(Collectors.toList());
    }

    public LoginRespuesta registrarPorAdmin(UsuarioAdminRegistroDto dto) {
        if (repositorioUsuario.findByUsername(dto.getUsername()).isPresent()) {
            return LoginRespuesta.builder()
                    .succes(false)
                    .mensaje("El nombre de usuario ya está registrado")
                    .build();
        }

        Promotoras promotora = null;
        if (dto.getIdPromotora() != null) {
            promotora = repositorioPromotoras.findById(dto.getIdPromotora()).orElse(null);
        }

        Usuario usuario = Usuario.builder()
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .nombre(dto.getNombre())
                .rol(dto.getRol())
                .telefono(dto.getTelefono())
                .correo(dto.getCorreo())
                .activo(dto.isActivo())
                .promotora(promotora)
                .build();

        repositorioUsuario.save(usuario);

        return LoginRespuesta.builder()
                .succes(true)
                .mensaje("Usuario registrado con éxito")
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombre(usuario.getNombre())
                .rol(usuario.getRol() != null ? usuario.getRol().name() : null)
                .telefono(usuario.getTelefono())
                .correo(usuario.getCorreo())
                .activo(usuario.isActivo())
                .idPromotora(usuario.getPromotora() != null ? usuario.getPromotora().getIdPromotora() : null)
                .nombrePromotora(usuario.getPromotora() != null ? usuario.getPromotora().getPromotora() : null)
                .build();
    }

    public LoginRespuesta actualizarPorAdmin(int id, UsuarioAdminEditDto dto) {
        Usuario usuario = repositorioUsuario.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!usuario.getUsername().equals(dto.getUsername()) && 
            repositorioUsuario.findByUsername(dto.getUsername()).isPresent()) {
            return LoginRespuesta.builder()
                    .succes(false)
                    .mensaje("El nombre de usuario ya está en uso")
                    .build();
        }

        Promotoras promotora = null;
        if (dto.getIdPromotora() != null) {
            promotora = repositorioPromotoras.findById(dto.getIdPromotora()).orElse(null);
        }

        usuario.setUsername(dto.getUsername());
        usuario.setNombre(dto.getNombre());
        usuario.setRol(dto.getRol());
        usuario.setTelefono(dto.getTelefono());
        usuario.setCorreo(dto.getCorreo());
        usuario.setActivo(dto.isActivo());
        usuario.setPromotora(promotora);

        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        repositorioUsuario.save(usuario);

        return LoginRespuesta.builder()
                .succes(true)
                .mensaje("Usuario actualizado con éxito")
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombre(usuario.getNombre())
                .rol(usuario.getRol() != null ? usuario.getRol().name() : null)
                .telefono(usuario.getTelefono())
                .correo(usuario.getCorreo())
                .activo(usuario.isActivo())
                .idPromotora(usuario.getPromotora() != null ? usuario.getPromotora().getIdPromotora() : null)
                .nombrePromotora(usuario.getPromotora() != null ? usuario.getPromotora().getPromotora() : null)
                .build();
    }

    public Optional<Usuario> obtenerUsuarioPorUsername(String username) {
        return repositorioUsuario.findByUsername(username);
    }

    @Transactional
    public void eliminar(int id) {
        repositorioVisitas.setTecnicoToNull(id);
        repositorioUsuario.deleteById(id);
    }

    public Usuario registrar(Usuario usuario) {
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return repositorioUsuario.save(usuario);
    }
}
