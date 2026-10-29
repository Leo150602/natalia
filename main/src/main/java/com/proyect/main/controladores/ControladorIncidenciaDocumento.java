package com.proyect.main.controladores;

import com.proyect.main.modelos.IncidenciaDocumento;
import com.proyect.main.modelos.Usuario;
import com.proyect.main.modelos.enums.EstadoDocumentoIncidencia;
import com.proyect.main.servicios.ServicioIncidenciaDocumento;
import com.proyect.main.servicios.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/incidencias")
@RequiredArgsConstructor
public class ControladorIncidenciaDocumento {

    private final ServicioIncidenciaDocumento servicioIncidenciaDocumento;

    private boolean esUsuarioNoAutenticado() {
        Usuario actual = UserContext.getCurrentUsuario();
        return actual == null;
    }

    @GetMapping("/{idIncidencia}/documentos")
    public ResponseEntity<?> listarDocumentosDeIncidencia(@PathVariable int idIncidencia) {
        if (esUsuarioNoAutenticado()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Debe iniciar sesión para ver este recurso");
        }
        List<IncidenciaDocumento> docs = servicioIncidenciaDocumento.listarPorIncidencia(idIncidencia);
        return ResponseEntity.ok(docs);
    }

    @PostMapping("/{idIncidencia}/documentos/subir")
    public ResponseEntity<?> subirYAsociarDocumento(
            @PathVariable int idIncidencia,
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam("estado") EstadoDocumentoIncidencia estado,
            @RequestParam(value = "nombre", required = false) String nombre) {
        if (esUsuarioNoAutenticado()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Debe iniciar sesión para realizar esta acción");
        }
        try {
            if (archivo.isEmpty()) {
                return ResponseEntity.badRequest().body("El archivo no puede estar vacío");
            }
            IncidenciaDocumento guardado = servicioIncidenciaDocumento.subirYAsociar(idIncidencia, archivo, estado, nombre);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al subir y asociar el documento: " + e.getMessage());
        }
    }

    @PutMapping("/documentos/{id}")
    public ResponseEntity<?> actualizarAsociacionDocumento(
            @PathVariable int id,
            @RequestParam(value = "archivo", required = false) MultipartFile archivo,
            @RequestParam(value = "estado", required = false) EstadoDocumentoIncidencia estado,
            @RequestParam(value = "nombre", required = false) String nombre) {
        if (esUsuarioNoAutenticado()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Debe iniciar sesión para realizar esta acción");
        }
        try {
            IncidenciaDocumento actualizado = servicioIncidenciaDocumento.actualizarAsociacion(id, archivo, estado, nombre);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al actualizar la relación del documento: " + e.getMessage());
        }
    }

    @DeleteMapping("/documentos/{id}")
    public ResponseEntity<?> eliminarAsociacionDocumento(@PathVariable int id) {
        if (esUsuarioNoAutenticado()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Debe iniciar sesión para realizar esta acción");
        }
        try {
            servicioIncidenciaDocumento.eliminarAsociacion(id);
            return ResponseEntity.ok().body("Relación y archivo eliminados con éxito");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al eliminar la relación del documento: " + e.getMessage());
        }
    }
}
