package com.proyect.main.servicios;

import com.proyect.main.modelos.Personas;
import com.proyect.main.modelos.Pisos;
import com.proyect.main.modelos.Promociones;
import com.proyect.main.modelos.enums.TipoPersonas;
import com.proyect.main.modelos.dtos.entrada.PisosDto;
import com.proyect.main.modelos.dtos.salida.PisosRespuesta;
import com.proyect.main.repositorios.IRepositorioPersonas;
import com.proyect.main.repositorios.IRepositorioPisos;
import com.proyect.main.repositorios.IRepositorioPromociones;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicioPisos {

    private final IRepositorioPisos repositorioPisos;
    private final IRepositorioPromociones repositorioPromociones;
    private final IRepositorioPersonas repositorioPersonas;

    public PisosRespuesta insertar(PisosDto dto) {
        try {
            Promociones promocion = repositorioPromociones.findById(dto.getIdPromocion())
                    .orElseThrow(() -> new IllegalArgumentException("Promoción no encontrada con ID: " + dto.getIdPromocion()));

            Personas propietario = obtenerOcrearPropietario(dto.getPropietarioNombre(), dto.getPropietarioTelefono());

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

            Personas propietario = obtenerOcrearPropietario(dto.getPropietarioNombre(), dto.getPropietarioTelefono());

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
        try (Workbook workbook = new XSSFWorkbook(archivo.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Verificar si la promoción existe
            if (!repositorioPromociones.existsById(idPromocion)) {
                throw new IllegalArgumentException("La promoción con ID " + idPromocion + " no existe.");
            }

            // Ignorar la primera fila (encabezado) e iterar desde la fila index 1
            for (int fila = 1; fila <= sheet.getLastRowNum(); fila++) {
                Row row = sheet.getRow(fila);

                if (filaVacia(row)) {
                    continue;
                }

                String nombrePiso = getString(row.getCell(0));
                String propietarioNombre = getString(row.getCell(1));
                String propietarioTelefono = getString(row.getCell(2));

                if (nombrePiso.isEmpty()) {
                    continue; // Saltar filas incompletas
                }

                // Construir DTO y reutilizar el servicio de inserción
                PisosDto dto = PisosDto.builder()
                        .piso(nombrePiso)
                        .idPromocion(idPromocion)
                        .propietarioNombre(propietarioNombre)
                        .propietarioTelefono(propietarioTelefono)
                        .build();

                this.insertar(dto);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al importar pisos desde Excel: " + e.getMessage(), e);
        }
    }

    public ByteArrayResource exportar(int idPromocion) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Pisos");
            int filaIndex = 0;

            // Fila de Encabezados (sirve como plantilla)
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

    private Personas obtenerOcrearPropietario(String nombre, String telefono) {
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

    public void eliminar(int id) {
        try {
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
