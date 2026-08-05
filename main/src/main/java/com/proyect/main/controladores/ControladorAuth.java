package com.proyect.main.controladores;

import com.proyect.main.modelos.dtos.entrada.LoginDto;
import com.proyect.main.modelos.dtos.entrada.ActualizarUsuarioDto;
import com.proyect.main.modelos.dtos.entrada.CambiarPasswordDto;
import com.proyect.main.modelos.dtos.entrada.UsuarioAdminRegistroDto;
import com.proyect.main.modelos.dtos.entrada.UsuarioAdminEditDto;
import com.proyect.main.modelos.dtos.salida.LoginRespuesta;
import com.proyect.main.modelos.Usuario;
import com.proyect.main.servicios.ServicioUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ControladorAuth {

    private final ServicioUsuario servicioUsuario;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDto dto, HttpServletRequest request, HttpServletResponse response) {
        try {
            LoginRespuesta respuesta = servicioUsuario.login(dto);
            if (respuesta.isSucces()) {
                Usuario usuario = servicioUsuario.obtenerUsuarioPorUsername(dto.getUsername()).orElse(null);
                if (usuario != null) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        usuario, null, java.util.Collections.emptyList()
                    );
                    SecurityContext context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(auth);
                    SecurityContextHolder.setContext(context);
                    securityContextRepository.saveContext(context, request, response);
                }
                return ResponseEntity.ok(respuesta);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(respuesta);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/usuario/{id}")
    public ResponseEntity<?> getUsuario(@PathVariable int id) {
        try {
            return ResponseEntity.ok(servicioUsuario.obtenerPorId(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/usuario/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable int id, @RequestBody ActualizarUsuarioDto dto) {
        try {
            Usuario actual = com.proyect.main.servicios.UserContext.getCurrentUsuario();
            if (actual == null || (actual.getId() != id && !com.proyect.main.servicios.UserContext.puedeInsertarEditar())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para actualizar este usuario");
            }
            return ResponseEntity.ok(servicioUsuario.actualizar(id, dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/usuario/{id}/password")
    public ResponseEntity<?> cambiarPassword(@PathVariable int id, @RequestBody CambiarPasswordDto dto) {
        try {
            Usuario actual = com.proyect.main.servicios.UserContext.getCurrentUsuario();
            if (actual == null || (actual.getId() != id && !com.proyect.main.servicios.UserContext.puedeInsertarEditar())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para cambiar la contraseña de este usuario");
            }
            LoginRespuesta respuesta = servicioUsuario.cambiarPassword(id, dto);
            if (respuesta.isSucces()) {
                return ResponseEntity.ok(respuesta);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(respuesta);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/usuarios")
    public ResponseEntity<?> obtenerUsuarios() {
        try {
            return ResponseEntity.ok(servicioUsuario.listarTodos());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/clientes")
    public ResponseEntity<?> obtenerClientes() {
        try {
            return ResponseEntity.ok(servicioUsuario.listarClientes());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/tecnicos")
    public ResponseEntity<?> obtenerTecnicos() {
        try {
            return ResponseEntity.ok(servicioUsuario.listarTecnicos());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/usuarios")
    public ResponseEntity<?> registrarUsuario(@RequestBody UsuarioAdminRegistroDto dto) {
        try {
            if (!com.proyect.main.servicios.UserContext.puedeAdministrarUsuarios()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para registrar usuarios");
            }
            LoginRespuesta respuesta = servicioUsuario.registrarPorAdmin(dto);
            if (respuesta.isSucces()) {
                return ResponseEntity.ok(respuesta);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(respuesta);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<?> actualizarUsuarioPorAdmin(@PathVariable int id, @RequestBody UsuarioAdminEditDto dto) {
        try {
            if (!com.proyect.main.servicios.UserContext.puedeAdministrarUsuarios()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para actualizar usuarios");
            }
            LoginRespuesta respuesta = servicioUsuario.actualizarPorAdmin(id, dto);
            if (respuesta.isSucces()) {
                return ResponseEntity.ok(respuesta);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(respuesta);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable int id) {
        try {
            if (!com.proyect.main.servicios.UserContext.puedeAdministrarUsuarios()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para eliminar usuarios");
            }
            servicioUsuario.eliminar(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        try {
            Usuario actual = com.proyect.main.servicios.UserContext.getCurrentUsuario();
            if (actual != null) {
                return ResponseEntity.ok(servicioUsuario.obtenerPorId(actual.getId()));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No hay una sesión activa");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            SecurityContextHolder.clearContext();
            return ResponseEntity.ok().body("Sesión cerrada con éxito");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
