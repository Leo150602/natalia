package com.proyect.main.controladores;

import com.proyect.main.modelos.dtos.entrada.PromotorasDto;
import com.proyect.main.modelos.dtos.salida.PromotorasRespuesta;
import com.proyect.main.servicios.ServicioPromotoras;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotoras")
@RequiredArgsConstructor
public class ControladorPromotoras {

    private final ServicioPromotoras servicioPromotoras;

    @PostMapping
    public ResponseEntity<?> insertar(@RequestBody PromotorasDto dto) {
        try {
            PromotorasRespuesta respuesta = servicioPromotoras.insertar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> obtenerTodos() {
        try {
            List<PromotorasRespuesta> respuesta = servicioPromotoras.obtenerTodos();
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable int id) {
        try {
            return servicioPromotoras.obtenerPorId(id)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Promotora no encontrada con ID: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable int id, @RequestBody PromotorasDto dto) {
        try {
            PromotorasRespuesta respuesta = servicioPromotoras.actualizar(id, dto);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
