package com.proyect.main.controladores;

import com.proyect.main.modelos.dtos.entrada.IncidenciasDto;
import com.proyect.main.modelos.dtos.entrada.IncidenciasFiltroDto;
import com.proyect.main.modelos.dtos.salida.IncidenciasRespuesta;
import com.proyect.main.servicios.ServicioIncidencias;
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
@RequestMapping("/api/incidencias")
@RequiredArgsConstructor
public class ControladorIncidencias {

    private final ServicioIncidencias servicioIncidencias;

    @PostMapping
    public ResponseEntity<?> insertar(@RequestBody IncidenciasDto dto) {
        try {
            IncidenciasRespuesta respuesta = servicioIncidencias.insertar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> obtenerTodos() {
        try {
            List<IncidenciasRespuesta> respuesta = servicioIncidencias.obtenerTodas();
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/promocion/{idPromocion}")
    public ResponseEntity<?> obtenerPorPromocion(@PathVariable int idPromocion) {
        try {
            List<IncidenciasRespuesta> respuesta = servicioIncidencias.obtenerPorPromocion(idPromocion);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable String id) {
        try {
            return servicioIncidencias.obtenerPorId(id)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Incidencia no encontrada con ID: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable String id, @RequestBody IncidenciasDto dto) {
        try {
            IncidenciasRespuesta respuesta = servicioIncidencias.actualizar(id, dto);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/filtrar")
    public ResponseEntity<?> filtrar(@RequestBody IncidenciasFiltroDto filtro) {
        try {
            List<IncidenciasRespuesta> respuesta = servicioIncidencias.filtrar(filtro);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/importar/{idPromocion}")
    public ResponseEntity<?> importar(@RequestParam("archivo") MultipartFile archivo, @PathVariable int idPromocion) {
        try {
            servicioIncidencias.importar(archivo, idPromocion);
            return ResponseEntity.ok("Archivo Excel de Incidencias importado exitosamente.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al importar archivo de incidencias: " + e.getMessage());
        }
    }

    @GetMapping("/exportar/{idPromocion}")
    public ResponseEntity<?> exportar(@PathVariable int idPromocion) {
        try {
            ByteArrayResource resource = servicioIncidencias.exportar(idPromocion);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"incidencias.xlsx\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al exportar incidencias a Excel: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable String id) {
        try {
            servicioIncidencias.eliminar(id);
            return ResponseEntity.ok("Incidencia eliminada exitosamente.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/cantidad/promocion/{idPromocion}")
    public ResponseEntity<?> obtenerCantidadPorPromocion(@PathVariable int idPromocion) {
        try {
            return ResponseEntity.ok(servicioIncidencias.obtenerCantidadPorPromocion(idPromocion));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
