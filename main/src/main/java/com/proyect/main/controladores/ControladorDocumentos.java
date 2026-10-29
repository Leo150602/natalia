package com.proyect.main.controladores;

import com.proyect.main.modelos.Documento;
import com.proyect.main.modelos.Usuario;
import com.proyect.main.modelos.enums.TipoDocumento;
import com.proyect.main.servicios.ServicioDocumento;
import com.proyect.main.servicios.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
public class ControladorDocumentos {

    private final ServicioDocumento servicioDocumento;

    private boolean esUsuarioNoAutorizado() {
        Usuario actual = UserContext.getCurrentUsuario();
        return actual == null || (!"DESARROLLADOR".equals(actual.getRol().name()) && actual.getId() != 2);
    }

    @PostMapping("/subir")
    public ResponseEntity<?> subirDocumento(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam("tipo") TipoDocumento tipo,
            @RequestParam(value = "nombre", required = false) String nombre) {
        if (esUsuarioNoAutorizado()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para acceder a este recurso");
        }
        try {
            if (archivo.isEmpty()) {
                return ResponseEntity.badRequest().body("El archivo no puede estar vacío");
            }
            Documento guardado = servicioDocumento.guardarDocumento(archivo, tipo, nombre);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al subir el documento: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> listarDocumentos() {
        if (esUsuarioNoAutorizado()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para acceder a este recurso");
        }
        return ResponseEntity.ok(servicioDocumento.listarTodos());
    }

    @GetMapping("/{id}/descargar")
    public ResponseEntity<?> descargarDocumento(@PathVariable int id) {
        try {
            Documento doc = servicioDocumento.listarTodos().stream()
                    .filter(d -> d.getId() == id)
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado con ID: " + id));

            String uniqueFilename = doc.getRuta().substring(doc.getRuta().lastIndexOf("/") + 1);
            if (uniqueFilename.contains("?")) {
                uniqueFilename = uniqueFilename.substring(0, uniqueFilename.indexOf("?"));
            }
            try {
                uniqueFilename = java.net.URLDecoder.decode(uniqueFilename, java.nio.charset.StandardCharsets.UTF_8.name());
            } catch (Exception e) {
                // ignore
            }
            byte[] bytes = servicioDocumento.descargarArchivoGcs(uniqueFilename);
            
            String contentType = "application/octet-stream";
            if (doc.getNombre().toLowerCase().endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (doc.getNombre().toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            } else if (doc.getNombre().toLowerCase().endsWith(".jpg") || doc.getNombre().toLowerCase().endsWith(".jpeg")) {
                contentType = "image/jpeg";
            }
            
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al descargar el archivo: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarDocumento(
            @PathVariable int id,
            @RequestParam(value = "archivo", required = false) MultipartFile archivo,
            @RequestParam(value = "nombre", required = false) String nombre) {
        if (esUsuarioNoAutorizado()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para acceder a este recurso");
        }
        try {
            Documento actualizado = servicioDocumento.actualizarDocumento(id, archivo, nombre);
            return ResponseEntity.ok(actualizado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al actualizar el documento: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarDocumento(@PathVariable int id) {
        if (esUsuarioNoAutorizado()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para acceder a este recurso");
        }
        try {
            servicioDocumento.eliminar(id);
            return ResponseEntity.ok().body("Documento eliminado con éxito");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al eliminar el documento: " + e.getMessage());
        }
    }
}
