package com.proyect.main.controladores;

import com.proyect.main.modelos.dtos.salida.IncidenciasRespuesta;
import com.proyect.main.servicios.ServicioSolicitudes;
import com.proyect.main.servicios.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/solicitudes")
@RequiredArgsConstructor
public class ControladorSolicitudes {

    private final ServicioSolicitudes servicioSolicitudes;

    @GetMapping
    public List<IncidenciasRespuesta> obtenerSolicitudes(@RequestParam(required = false) Integer idPromocion) {
        return servicioSolicitudes.listarSolicitudes(idPromocion);
    }

    @PostMapping("/aceptar/{id}")
    public ResponseEntity<?> aceptar(@PathVariable int id) {
        try {
            if (!UserContext.puedeInsertarEditar()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para aceptar solicitudes");
            }
            servicioSolicitudes.aceptarSolicitud(id);
            return ResponseEntity.ok().body("Solicitud aceptada con éxito");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/rechazar/{id}")
    public ResponseEntity<?> rechazar(@PathVariable int id) {
        try {
            if (!UserContext.puedeInsertarEditar()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para rechazar solicitudes");
            }
            servicioSolicitudes.rechazarSolicitud(id);
            return ResponseEntity.ok().body("Solicitud rechazada con éxito");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/aceptar-multiples")
    public ResponseEntity<?> aceptarMultiples(@RequestBody List<Integer> ids) {
        try {
            if (!UserContext.puedeInsertarEditar()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para aceptar solicitudes");
            }
            servicioSolicitudes.aceptarMultiples(ids);
            return ResponseEntity.ok().body("Solicitudes aceptadas con éxito");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/rechazar-multiples")
    public ResponseEntity<?> rechazarMultiples(@RequestBody List<Integer> ids) {
        try {
            if (!UserContext.puedeInsertarEditar()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para rechazar solicitudes");
            }
            servicioSolicitudes.rechazarMultiples(ids);
            return ResponseEntity.ok().body("Solicitudes rechazadas con éxito");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
