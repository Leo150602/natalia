package com.proyect.main.servicios;

import com.proyect.main.modelos.Personas;
import com.proyect.main.modelos.Pisos;
import com.proyect.main.modelos.Promociones;
import com.proyect.main.modelos.enums.TipoPersonas;
import com.proyect.main.modelos.dtos.entrada.PisosDto;
import com.proyect.main.modelos.dtos.salida.PisosRespuesta;
import com.proyect.main.repositorios.IRepositorioIncidencias;
import com.proyect.main.repositorios.IRepositorioPersonas;
import com.proyect.main.repositorios.IRepositorioPisos;
import com.proyect.main.repositorios.IRepositorioPromociones;
import com.proyect.main.repositorios.IRepositorioVisitas;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicioPisos {

    private static final Logger log = LoggerFactory.getLogger(ServicioPisos.class);

    private final IRepositorioPisos repositorioPisos;
    private final IRepositorioPromociones repositorioPromociones;
    private final IRepositorioPersonas repositorioPersonas;
    private final IRepositorioIncidencias repositorioIncidencias;
    private final IRepositorioVisitas repositorioVisitas;
    private final ServicioIncidenciaDocumento servicioIncidenciaDocumento;

    public PisosRespuesta insertar(PisosDto dto) {
        try {
            Promociones promocion = repositorioPromociones.findById(dto.getIdPromocion())
                    .orElseThrow(() -> new IllegalArgumentException("Promoción no encontrada con ID: " + dto.getIdPromocion()));

            Personas propietario = null;
            if (dto.getIdPropietario() != null) {
                propietario = repositorioPersonas.findById(dto.getIdPropietario()).orElse(null);
            } else {
                propietario = obtenerOcrearPropietario(dto.getPropietarioNombre(), dto.getPropietarioTelefono(), promocion);
            }

            String pisoNombre = dto.getPiso() != null ? dto.getPiso().trim().toUpperCase() : "";

            Optional<Pisos> existente = repositorioPisos.findByPisoAndPromocionId(pisoNombre, promocion.getIdPromocion());
            if (existente.isPresent()) {
                Pisos p = existente.get();
                p.setPropietario(propietario);
                return mapear(repositorioPisos.save(p));
            }

            Pisos piso = Pisos.builder()
                    .piso(pisoNombre)
                    .promocion(promocion)
                    .propietario(propietario)
                    .build();

            return mapear(repositorioPisos.save(piso));
        } catch (Exception e) {
            throw new RuntimeException("Error al insertar piso: " + e.getMessage(), e);
        }
    }

    public List<PisosRespuesta> obtenerTodos() {
        try {
            return repositorioPisos.findAllPisos().stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener pisos: " + e.getMessage(), e);
        }
    }

    public List<PisosRespuesta> obtenerPorPromocion(int idPromocion) {
        try {
            return repositorioPisos.findByPromocionId(idPromocion).stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener pisos por promoción: " + e.getMessage(), e);
        }
    }

    public Optional<PisosRespuesta> obtenerPorId(int id) {
        try {
            return repositorioPisos.findByIdWithDetails(id).map(this::mapear);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener piso por ID: " + e.getMessage(), e);
        }
    }

    public PisosRespuesta actualizar(int id, PisosDto dto) {
        try {
            Pisos piso = repositorioPisos.findByIdWithDetails(id)
                    .orElseThrow(() -> new IllegalArgumentException("Piso no encontrado con ID: " + id));

            Promociones promocion = repositorioPromociones.findById(dto.getIdPromocion())
                    .orElseThrow(() -> new IllegalArgumentException("Promoción no encontrada con ID: " + dto.getIdPromocion()));

            Personas propietario = null;
            if (dto.getIdPropietario() != null) {
                propietario = repositorioPersonas.findById(dto.getIdPropietario()).orElse(null);
            } else {
                propietario = obtenerOcrearPropietario(dto.getPropietarioNombre(), dto.getPropietarioTelefono(), promocion);
            }

            String pisoNombre = dto.getPiso() != null ? dto.getPiso().trim().toUpperCase() : "";

            piso.setPiso(pisoNombre);
            piso.setPromocion(promocion);
            piso.setPropietario(propietario);

            return mapear(repositorioPisos.save(piso));
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar piso: " + e.getMessage(), e);
        }
    }

    public void importar(MultipartFile archivo, int idPromocion) throws IOException {
        log.info("--- INICIO IMPORTACIÓN DE PISOS ---");
        log.info("Archivo: {}", archivo.getOriginalFilename());
        log.info("Promoción ID: {}", idPromocion);

        int totalFilas = 0;
        int subidosExito = 0;
        int noSubidos = 0;

        List<String> detallesExito = new java.util.ArrayList<>();
        List<String> detallesFallo = new java.util.ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(archivo.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            if (!repositorioPromociones.existsById(idPromocion)) {
                throw new IllegalArgumentException("La promoción con ID " + idPromocion + " no existe.");
            }

            for (int fila = 1; fila <= sheet.getLastRowNum(); fila++) {
                Row row = sheet.getRow(fila);

                if (filaVacia(row)) {
                    continue;
                }

                totalFilas++;
                String nombrePiso = "";
                String propietarioNombre = "";
                String propietarioTelefono = "";
                try {
                    nombrePiso = getString(row.getCell(0));
                    propietarioNombre = getString(row.getCell(1));
                    propietarioTelefono = getString(row.getCell(2));

                    if (nombrePiso.isEmpty()) {
                        detallesFallo.add("Fila " + fila + " -> No subido: Nombre de piso vacío.");
                        noSubidos++;
                        continue; 
                    }

                    PisosDto dto = PisosDto.builder()
                            .piso(nombrePiso)
                            .idPromocion(idPromocion)
                            .propietarioNombre(propietarioNombre)
                            .propietarioTelefono(propietarioTelefono)
                            .build();

                    this.insertar(dto);
                    detallesExito.add("Fila " + fila + " [Piso: '" + nombrePiso + "', Propietario: '" + propietarioNombre + "'] -> Guardado exitosamente.");
                    subidosExito++;
                } catch (Exception e) {
                    detallesFallo.add("Fila " + fila + " [Piso: '" + nombrePiso + "'] -> Error: " + e.getMessage());
                    noSubidos++;
                }
            }

            log.info("Registros subidos con éxito ({}):", subidosExito);
            for (String msg : detallesExito) {
                log.info("  {}", msg);
            }

            if (noSubidos > 0) {
                log.warn("Registros NO subidos ({}):", noSubidos);
                for (String msg : detallesFallo) {
                    log.warn("  {}", msg);
                }
            } else {
                log.info("Todos los registros se subieron con éxito.");
            }

            log.info("Resumen de importación: Total filas procesadas = {}, Éxitos = {}, Fallas = {}", totalFilas, subidosExito, noSubidos);
            log.info("--- FIN IMPORTACIÓN DE PISOS ---");

        } catch (Exception e) {
            log.error("Error crítico durante la importación de pisos desde Excel: {}", e.getMessage(), e);
            throw new RuntimeException("Error al importar pisos desde Excel: " + e.getMessage(), e);
        }
    }

    public ByteArrayResource exportar(int idPromocion) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Pisos");
            int filaIndex = 0;

            Row encabezado = sheet.createRow(filaIndex++);
            encabezado.createCell(0).setCellValue("Piso");
            encabezado.createCell(1).setCellValue("Propietario");
            encabezado.createCell(2).setCellValue("Teléfono");

            List<Pisos> listaPisos = repositorioPisos.findByPromocionId(idPromocion);

            for (Pisos piso : listaPisos) {
                Row row = sheet.createRow(filaIndex++);
                row.createCell(0).setCellValue(piso.getPiso());
                row.createCell(1).setCellValue(piso.getPropietario() != null ? piso.getPropietario().getNombre() : "");
                row.createCell(2).setCellValue(piso.getPropietario() != null ? piso.getPropietario().getTelefono() : "");
            }

            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(output);
            return new ByteArrayResource(output.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Error al exportar pisos a Excel: " + e.getMessage(), e);
        }
    }

    private Personas obtenerOcrearPropietario(String nombre, String telefono, Promociones promocion) {
        if (telefono == null || telefono.trim().isEmpty()) {
            return null;
        }
        Optional<Personas> personaOpt = repositorioPersonas.findByTelefono(telefono);
        if (personaOpt.isPresent()) {
            Personas persona = personaOpt.get();
            if (persona.getTipoPersonas() != TipoPersonas.PROPIETARIO) {
                throw new IllegalArgumentException("La persona con teléfono " + telefono + 
                        " existe pero no es del tipo PROPIETARIO. Tipo actual: " + persona.getTipoPersonas());
            }
            return persona;
        } else {
            return repositorioPersonas.save(Personas.builder()
                    .nombre(nombre != null && !nombre.isEmpty() ? nombre : "Propietario S/N")
                    .telefono(telefono)
                    .tipoPersonas(TipoPersonas.PROPIETARIO)
                    .promotora(null)
                    .build());
        }
    }

    private boolean filaVacia(Row row) {
        if (row == null) {
            return true;
        }
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    public String getString(Cell cell) {
        if (cell == null) {
            return "";
        }
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    @Transactional
    public void eliminar(int id) {
        try {
            List<Integer> idsIncidencias = repositorioIncidencias.findIdsByPisoId(id);
            for (Integer idIncidencia : idsIncidencias) {
                List<com.proyect.main.modelos.IncidenciaDocumento> relaciones =
                        servicioIncidenciaDocumento.listarPorIncidencia(idIncidencia);
                for (com.proyect.main.modelos.IncidenciaDocumento rel : relaciones) {
                    servicioIncidenciaDocumento.eliminarAsociacion(rel.getId());
                }
            }
            repositorioVisitas.deleteByPisoId(id);
            repositorioIncidencias.deleteByPisoId(id);
            repositorioPisos.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar piso: " + e.getMessage(), e);
        }
    }

    private PisosRespuesta mapear(Pisos piso) {
        return PisosRespuesta.builder()
                .idPiso(piso.getIdPiso())
                .piso(piso.getPiso())
                .promocion(piso.getPromocion() != null ? piso.getPromocion().getPromocion() : null)
                .promotora(piso.getPromocion() != null && piso.getPromocion().getPromotora() != null ? piso.getPromocion().getPromotora().getPromotora() : null)
                .propietario(piso.getPropietario() != null ? piso.getPropietario().getNombre() : null)
                .telefonoPropietario(piso.getPropietario() != null ? piso.getPropietario().getTelefono() : null)
                .idPropietario(piso.getPropietario() != null ? piso.getPropietario().getIdPersona() : null)
                .build();
    }

    public long obtenerCantidadPorPromocion(int idPromocion) {
        try {
            return repositorioPisos.countByPromocion_IdPromocion(idPromocion);
        } catch (Exception e) {
            throw new RuntimeException("Error al contar pisos por promoción: " + e.getMessage(), e);
        }
    }
}
