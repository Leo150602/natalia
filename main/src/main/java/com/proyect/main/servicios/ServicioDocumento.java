package com.proyect.main.servicios;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.proyect.main.modelos.Documento;
import com.proyect.main.modelos.enums.FormatoDocumento;
import com.proyect.main.modelos.enums.TipoDocumento;
import com.proyect.main.repositorios.RepositorioDocumento;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServicioDocumento {

    private final RepositorioDocumento repositorioDocumento;
    private final Storage storage;

    @Value("${gcp.bucket-name}")
    private String bucketName;

    public Documento guardarDocumento(MultipartFile file, TipoDocumento tipo, String nombrePersonalizado) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "unnamed_document";
        }

        // Si se proporciona un nombre personalizado, usarlo. De lo contrario, usar el original.
        String nombreFinal = (nombrePersonalizado != null && !nombrePersonalizado.trim().isEmpty()) 
                ? nombrePersonalizado.trim() 
                : originalFilename;

        // Determinar el formato
        FormatoDocumento formato = determinarFormato(originalFilename);

        // Generar nombre de archivo para GCS a partir de nombreFinal
        String extension = getFileExtension(originalFilename);
        String uniqueFilename = nombreFinal;
        if (!uniqueFilename.toLowerCase().endsWith("." + extension.toLowerCase())) {
            uniqueFilename += (extension.isEmpty() ? "" : "." + extension);
        }

        // Subir a GCS
        BlobId blobId = BlobId.of(bucketName, uniqueFilename);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();
        storage.create(blobInfo, file.getBytes());

        // Generar ruta pública de acceso
        String ruta = "https://storage.googleapis.com/" + bucketName + "/" + uniqueFilename;

        // Guardar metadatos en la base de datos
        Documento documento = Documento.builder()
                .nombre(nombreFinal)
                .fechaMontado(LocalDateTime.now())
                .tipoDocumento(tipo)
                .formato(formato)
                .ruta(ruta)
                .build();

        return obtenerConRutaFirmada(repositorioDocumento.save(documento));
    }

    public List<Documento> listarTodos() {
        return repositorioDocumento.findAll().stream()
                .map(this::obtenerConRutaFirmada)
                .collect(java.util.stream.Collectors.toList());
    }

    public void eliminar(int id) {
        Documento doc = repositorioDocumento.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado con ID: " + id));

        // Obtener el nombre del objeto en GCS decodificado desde la ruta
        String uniqueFilename = obtenerNombreObjetoDesdeRuta(doc.getRuta());

        // Eliminar de GCS
        BlobId blobId = BlobId.of(bucketName, uniqueFilename);
        storage.delete(blobId);

        // Eliminar de la base de datos
        repositorioDocumento.delete(doc);
    }

    public Documento actualizarDocumento(int id, MultipartFile file, String nombre) throws IOException {
        Documento doc = repositorioDocumento.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado con ID: " + id));

        String oldUniqueFilename = obtenerNombreObjetoDesdeRuta(doc.getRuta());
        String oldNombre = doc.getNombre();
        if (nombre != null && !nombre.trim().isEmpty()) {
            doc.setNombre(nombre.trim());
        }

        // Si se proporciona un nuevo archivo, realizar el intercambio físico
        if (file != null && !file.isEmpty()) {
            // 1. Eliminar el archivo físico de GCS
            try {
                storage.delete(BlobId.of(bucketName, oldUniqueFilename));
            } catch (Exception e) {
                System.err.println("Error al borrar archivo anterior en GCS: " + e.getMessage());
            }

            // 2. Subir el nuevo archivo a GCS
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                originalFilename = "unnamed_document";
            }
            if (nombre == null || nombre.trim().isEmpty()) {
                doc.setNombre(originalFilename);
            }
            
            FormatoDocumento formato = determinarFormato(originalFilename);
            String extension = getFileExtension(originalFilename);
            String uniqueFilename = doc.getNombre();
            if (!uniqueFilename.toLowerCase().endsWith("." + extension.toLowerCase())) {
                uniqueFilename += (extension.isEmpty() ? "" : "." + extension);
            }

            BlobId blobId = BlobId.of(bucketName, uniqueFilename);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(file.getContentType())
                    .build();
            storage.create(blobInfo, file.getBytes());

            String nuevaRuta = "https://storage.googleapis.com/" + bucketName + "/" + uniqueFilename;
            doc.setFormato(formato);
            doc.setRuta(nuevaRuta);
            doc.setFechaMontado(LocalDateTime.now());
        } else if (nombre != null && !nombre.trim().isEmpty() && !nombre.trim().equals(oldNombre)) {
            // Si solo cambia el nombre, renombrar el objeto en GCS
            try {
                String extension = getFileExtension(oldUniqueFilename);
                String newUniqueFilename = nombre.trim();
                if (!newUniqueFilename.toLowerCase().endsWith("." + extension.toLowerCase())) {
                    newUniqueFilename += (extension.isEmpty() ? "" : "." + extension);
                }
                
                BlobId source = BlobId.of(bucketName, oldUniqueFilename);
                BlobId target = BlobId.of(bucketName, newUniqueFilename);
                
                storage.copy(Storage.CopyRequest.of(source, target));
                storage.delete(source);
                
                String nuevaRuta = "https://storage.googleapis.com/" + bucketName + "/" + newUniqueFilename;
                doc.setRuta(nuevaRuta);
            } catch (Exception e) {
                System.err.println("Error al renombrar archivo en GCS: " + e.getMessage());
            }
        }

        return obtenerConRutaFirmada(repositorioDocumento.save(doc));
    }

    public Documento obtenerConRutaFirmada(Documento doc) {
        if (doc == null || doc.getRuta() == null) return doc;
        String rutaOriginal = doc.getRuta();
        // Evitar intentar firmar si ya es una URL firmada (contiene parámetros de firma de GCP)
        if (rutaOriginal.contains("GoogleAccessId=") || rutaOriginal.contains("Signature=")) {
            return doc;
        }
        String uniqueFilename = rutaOriginal.substring(rutaOriginal.lastIndexOf("/") + 1);
        try {
            java.net.URL signedUrl = storage.signUrl(
                BlobInfo.newBuilder(bucketName, uniqueFilename).build(),
                2, // URL firmada válida por 2 horas
                java.util.concurrent.TimeUnit.HOURS,
                Storage.SignUrlOption.withV4Signature()
            );
            return Documento.builder()
                    .id(doc.getId())
                    .nombre(doc.getNombre())
                    .fechaMontado(doc.getFechaMontado())
                    .tipoDocumento(doc.getTipoDocumento())
                    .formato(doc.getFormato())
                    .ruta(signedUrl.toString())
                    .build();
        } catch (Exception e) {
            System.err.println("Error al firmar la URL del documento: " + e.getMessage());
            return doc;
        }
    }

    public byte[] descargarArchivoGcs(String uniqueFilename) {
        BlobId blobId = BlobId.of(bucketName, uniqueFilename);
        return storage.readAllBytes(blobId);
    }

    private FormatoDocumento determinarFormato(String filename) {
        String ext = getFileExtension(filename).toLowerCase();
        switch (ext) {
            case "docx":
            case "doc":
                return FormatoDocumento.DOCX;
            case "xlsx":
            case "xls":
            case "csv":
                return FormatoDocumento.EXCEL;
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "bmp":
            case "webp":
                return FormatoDocumento.IMAGEN;
            case "mp4":
            case "avi":
            case "mkv":
            case "mov":
                return FormatoDocumento.VIDEO;
            case "pdf":
                return FormatoDocumento.PDF;
            default:
                return FormatoDocumento.OTRO;
        }
    }

    private String getFileExtension(String filename) {
        int lastIndex = filename.lastIndexOf(".");
        if (lastIndex == -1 || lastIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastIndex + 1);
    }

    private String obtenerNombreObjetoDesdeRuta(String ruta) {
        if (ruta == null) return "";
        String filename = ruta.substring(ruta.lastIndexOf("/") + 1);
        if (filename.contains("?")) {
            filename = filename.substring(0, filename.indexOf("?"));
        }
        try {
            return java.net.URLDecoder.decode(filename, java.nio.charset.StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            System.err.println("Error al decodificar nombre de objeto GCS: " + e.getMessage());
            return filename;
        }
    }
}
