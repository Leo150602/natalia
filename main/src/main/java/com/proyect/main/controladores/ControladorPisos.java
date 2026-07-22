package com.proyect.main.controladores;

import com.proyect.main.modelos.dtos.entrada.PisosDto;
import com.proyect.main.modelos.dtos.salida.PisosRespuesta;
import com.proyect.main.servicios.ServicioPisos;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/pisos")
@RequiredArgsConstructor
public class ControladorPisos {

    private final ServicioPisos servicioPisos;

    @PostMapping
    public ResponseEntity<?> insertar(@RequestBody PisosDto dto) {
        try {
            PisosRespuesta respuesta = servicioPisos.insertar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> obtenerTodos() {
        try {
            List<PisosRespuesta> respuesta = servicioPisos.obtenerTodos();
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/promocion/{idPromocion}")
    public ResponseEntity<?> obtenerPorPromocion(@PathVariable int idPromocion) {
        try {
            List<PisosRespuesta> respuesta = servicioPisos.obtenerPorPromocion(idPromocion);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable int id) {
        try {
            return servicioPisos.obtenerPorId(id)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Piso no encontrado con ID: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable int id, @RequestBody PisosDto dto) {
        try {
            PisosRespuesta respuesta = servicioPisos.actualizar(id, dto);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/importar/{idPromocion}")
    public ResponseEntity<?> importar(@RequestParam("archivo") MultipartFile archivo, @PathVariable int idPromocion) {
        try {
            servicioPisos.importar(archivo, idPromocion);
            return ResponseEntity.ok("Archivo Excel de Pisos importado exitosamente.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al importar archivo de pisos: " + e.getMessage());
        }
    }

    @GetMapping("/exportar/{idPromocion}")
    public ResponseEntity<?> exportar(@PathVariable int idPromocion) {
        try {
            ByteArrayResource resource = servicioPisos.exportar(idPromocion);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"pisos.xlsx\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al exportar pisos a Excel: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable int id) {
        try {
            servicioPisos.eliminar(id);
            return ResponseEntity.ok("Piso eliminado exitosamente.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/cantidad/promocion/{idPromocion}")
    public ResponseEntity<?> obtenerCantidadPorPromocion(@PathVariable int idPromocion) {
        try {
            return ResponseEntity.ok(servicioPisos.obtenerCantidadPorPromocion(idPromocion));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
