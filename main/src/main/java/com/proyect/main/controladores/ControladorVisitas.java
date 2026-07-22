package com.proyect.main.controladores;

import com.proyect.main.modelos.dtos.entrada.VisitasDto;
import com.proyect.main.modelos.dtos.salida.VisitasRespuesta;
import com.proyect.main.servicios.ServicioVisitas;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitas")
@RequiredArgsConstructor
public class ControladorVisitas {

    private final ServicioVisitas servicioVisitas;

    @PostMapping
    public ResponseEntity<?> insertar(@RequestBody VisitasDto dto) {
        try {
            VisitasRespuesta respuesta = servicioVisitas.insertar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> obtenerTodos() {
        try {
            List<VisitasRespuesta> respuesta = servicioVisitas.obtenerTodos();
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable int id) {
        try {
            return servicioVisitas.obtenerPorId(id)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Visita no encontrada con ID: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable int id, @RequestBody VisitasDto dto) {
        try {
            VisitasRespuesta respuesta = servicioVisitas.actualizar(id, dto);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable int id) {
        try {
            servicioVisitas.eliminar(id);
            return ResponseEntity.ok("Visita eliminada exitosamente.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/recientes/promocion/{idPromocion}")
    public ResponseEntity<?> obtenerRecientesPorPromocion(@PathVariable int idPromocion, @RequestParam(defaultValue = "10") int limite) {
        try {
            return ResponseEntity.ok(servicioVisitas.obtenerRecientesPorPromocion(idPromocion, limite));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }

    }
    @GetMapping("/promocion/{idPromocion}")
    public ResponseEntity<?> obtenerPorPromocion(@PathVariable int idPromocion) {
        try {
            return ResponseEntity.ok(servicioVisitas.obtenerPorPromocion(idPromocion));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
