package com.proyect.main.servicios;

import com.proyect.main.modelos.Documento;
import com.proyect.main.modelos.IncidenciaDocumento;
import com.proyect.main.modelos.Incidencias;
import com.proyect.main.modelos.Usuario;
import com.proyect.main.modelos.enums.EstadoDocumentoIncidencia;
import com.proyect.main.modelos.enums.TipoDocumento;
import com.proyect.main.repositorios.IRepositorioIncidencias;
import com.proyect.main.repositorios.RepositorioDocumento;
import com.proyect.main.repositorios.RepositorioIncidenciaDocumento;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicioIncidenciaDocumento {

    private final RepositorioIncidenciaDocumento repositorioIncidenciaDocumento;
    private final RepositorioDocumento repositorioDocumento;
    private final IRepositorioIncidencias repositorioIncidencias;
    private final ServicioDocumento servicioDocumento;

    public List<IncidenciaDocumento> listarPorIncidencia(int idIncidencia) {
        return repositorioIncidenciaDocumento.findByIncidenciaIdIncidencia(idIncidencia).stream()
                .map(this::obtenerConRutaFirmada)
                .collect(Collectors.toList());
    }

    @Transactional
    public IncidenciaDocumento subirYAsociar(int idIncidencia, MultipartFile file, EstadoDocumentoIncidencia estado, String nombrePersonalizado) throws IOException {
        Incidencias incidencia = repositorioIncidencias.findById(idIncidencia)
                .orElseThrow(() -> new IllegalArgumentException("Incidencia no encontrada con ID: " + idIncidencia));

        // Determinar el nombre del usuario logueado
        Usuario actual = UserContext.getCurrentUsuario();
        String nombreUsuario = "Sistema";
        if (actual != null) {
            String full = (actual.getNombre() != null ? actual.getNombre() : "").trim();
            nombreUsuario = full.isEmpty() ? actual.getUsername() : full;
        }

        // Mapear el tipo de documento del backend según el estado de la incidencia
        TipoDocumento tipoDoc = (estado == EstadoDocumentoIncidencia.FIRMADO) 
                ? TipoDocumento.FIRMADO 
                : TipoDocumento.ESPERANDO_FIRMA;

        // Generar nombre único con la regla de sufijos (2), (3) etc.
        String nombrePropuesto = (nombrePersonalizado != null && !nombrePersonalizado.trim().isEmpty()) 
                ? nombrePersonalizado.trim() 
                : file.getOriginalFilename();
        if (nombrePropuesto == null) {
            nombrePropuesto = "documento";
        }
        
        String nombreUnico = generarNombreUnico(idIncidencia, nombrePropuesto);

        // Subir a GCS y registrar en tabla Documentos
        Documento documento = servicioDocumento.guardarDocumento(file, tipoDoc, nombreUnico);

        // Crear la relación en incidencia_documentos
        IncidenciaDocumento relacion = IncidenciaDocumento.builder()
                .incidencia(incidencia)
                .documento(documento)
                .nombreSubio(nombreUsuario)
                .fechaActualizacion(LocalDateTime.now())
                .estado(estado)
                .build();

        return obtenerConRutaFirmada(repositorioIncidenciaDocumento.save(relacion));
    }

    @Transactional
    public IncidenciaDocumento actualizarAsociacion(int id, MultipartFile file, EstadoDocumentoIncidencia estado, String nombre) throws IOException {
        IncidenciaDocumento relacion = repositorioIncidenciaDocumento.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Relación Incidencia-Documento no encontrada con ID: " + id));

        // Obtener el usuario que actualiza
        Usuario actual = UserContext.getCurrentUsuario();
        String nombreUsuario = "Sistema";
        if (actual != null) {
            String full = (actual.getNombre() != null ? actual.getNombre() : "").trim();
            nombreUsuario = full.isEmpty() ? actual.getUsername() : full;
        }
        relacion.setNombreSubio(nombreUsuario);
        relacion.setFechaActualizacion(LocalDateTime.now());

        if (estado != null) {
            relacion.setEstado(estado);
            // Actualizar el TipoDocumento subyacente para mantener coherencia en las búsquedas
            Documento doc = relacion.getDocumento();
            TipoDocumento tipoDoc = (estado == EstadoDocumentoIncidencia.FIRMADO) 
                    ? TipoDocumento.FIRMADO 
                    : TipoDocumento.ESPERANDO_FIRMA;
            doc.setTipoDocumento(tipoDoc);
            repositorioDocumento.save(doc);
        }

        // Si se provee un nuevo archivo o se actualiza el nombre
        if ((file != null && !file.isEmpty()) || (nombre != null && !nombre.trim().isEmpty())) {
            String nombrePropuesto = (nombre != null && !nombre.trim().isEmpty()) 
                    ? nombre.trim() 
                    : (file != null ? file.getOriginalFilename() : relacion.getDocumento().getNombre());
            
            String nombreUnico = generarNombreUnico(relacion.getIncidencia().getIdIncidencia(), nombrePropuesto);
            
            Documento docActualizado = servicioDocumento.actualizarDocumento(relacion.getDocumento().getId(), file, nombreUnico);
            relacion.setDocumento(docActualizado);
        }

        return obtenerConRutaFirmada(repositorioIncidenciaDocumento.save(relacion));
    }

    @Transactional
    public void eliminarAsociacion(int id) {
        IncidenciaDocumento relacion = repositorioIncidenciaDocumento.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Relación Incidencia-Documento no encontrada con ID: " + id));

        int documentoId = relacion.getDocumento().getId();

        // 1. Eliminar la relación de la base de datos
        repositorioIncidenciaDocumento.delete(relacion);

        // 2. Eliminar el documento físico de GCS y su registro
        servicioDocumento.eliminar(documentoId);
    }

    private IncidenciaDocumento obtenerConRutaFirmada(IncidenciaDocumento assoc) {
        if (assoc == null) return null;
        Documento docFirmado = servicioDocumento.obtenerConRutaFirmada(assoc.getDocumento());
        return IncidenciaDocumento.builder()
                .id(assoc.getId())
                .incidencia(assoc.getIncidencia())
                .documento(docFirmado)
                .nombreSubio(assoc.getNombreSubio())
                .fechaActualizacion(assoc.getFechaActualizacion())
                .estado(assoc.getEstado())
                .build();
    }

    private String generarNombreUnico(int idIncidencia, String nombreBase) {
        // Limpiar el nombre base de extensiones si las tiene
        String extension = "";
        int dotIdx = nombreBase.lastIndexOf(".");
        String nombreSinExt = nombreBase;
        if (dotIdx > 0) {
            nombreSinExt = nombreBase.substring(0, dotIdx);
            extension = nombreBase.substring(dotIdx); // ej. ".pdf"
        }
        
        // Quitar cualquier sufijo tipo "_INC_\d+" o " (\d+)" del nombre original para no acumularlos
        nombreSinExt = nombreSinExt.replaceAll("_INC_\\d+", "");
        nombreSinExt = nombreSinExt.replaceAll("\\s\\(\\d+\\)$", "");
        
        String nombrePropuesto = nombreSinExt.trim() + "_INC_" + idIncidencia;
        
        boolean existe = repositorioDocumento.existsByNombre(nombrePropuesto + extension);
        if (!existe) {
            return nombrePropuesto + extension;
        }
        
        int contador = 2;
        while (true) {
            String nombreConContador = nombrePropuesto + " (" + contador + ")" + extension;
            if (!repositorioDocumento.existsByNombre(nombreConContador)) {
                return nombreConContador;
            }
            contador++;
        }
    }
}
