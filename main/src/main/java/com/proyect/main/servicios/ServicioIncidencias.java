package com.proyect.main.servicios;

import com.proyect.main.modelos.Incidencias;
import com.proyect.main.modelos.Pisos;
import com.proyect.main.modelos.Promociones;
import com.proyect.main.modelos.enums.CategoriaIncidencia;
import com.proyect.main.modelos.enums.EstadoIncidencia;
import com.proyect.main.modelos.enums.HorasTrabajadas;
import com.proyect.main.modelos.enums.RespuestaSNN;
import com.proyect.main.modelos.dtos.entrada.IncidenciasDto;
import com.proyect.main.modelos.dtos.entrada.IncidenciasFiltroDto;
import com.proyect.main.modelos.dtos.salida.IncidenciasRespuesta;
import com.proyect.main.modelos.dtos.salida.PisosRespuesta;
import com.proyect.main.repositorios.IRepositorioIncidencias;
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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicioIncidencias {

    private final IRepositorioIncidencias repositorioIncidencias;
    private final IRepositorioPisos repositorioPisos;
    private final IRepositorioPromociones repositorioPromociones;

    @PersistenceContext
    private EntityManager entityManager;

    public IncidenciasRespuesta insertar(IncidenciasDto dto) {
        try {
            Pisos piso = repositorioPisos.findById(dto.getIdPiso())
                    .orElseThrow(() -> new IllegalArgumentException("Piso no encontrado con ID: " + dto.getIdPiso()));

            Incidencias incidencia = Incidencias.builder()
                    .numeroIncidencia(dto.getNumeroIncidencia())
                    .categoriaIncidencia(dto.getCategoriaIncidencia())
                    .descripcionIncidencia(dto.getDescripcionIncidencia())
                    .observaciones(dto.getObservaciones())
                    .materialesRequeridos(dto.getMaterialesRequeridos())
                    .estadoIncidencia(dto.getEstadoIncidencia())
                    .horasTrabajadas(dto.getHorasTrabajadas())
                    .presupuesto(dto.getPresupuesto())
                    .proforma(dto.getProforma())
                    .piso(piso)
                    .fechaIncidencia(dto.getFechaIncidencia() != null ? dto.getFechaIncidencia() : LocalDateTime.now())
                    .build();

            return mapear(repositorioIncidencias.save(incidencia));
        } catch (Exception e) {
            throw new RuntimeException("Error al insertar incidencia: " + e.getMessage(), e);
        }
    }

    public List<IncidenciasRespuesta> obtenerTodas() {
        try {
            return repositorioIncidencias.findAllWithDetails().stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener incidencias: " + e.getMessage(), e);
        }
    }

    public List<IncidenciasRespuesta> obtenerPorPromocion(int idPromocion) {
        try {
            return repositorioIncidencias.findByPromocionId(idPromocion).stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener incidencias por promoción: " + e.getMessage(), e);
        }
    }

    public Optional<IncidenciasRespuesta> obtenerPorId(String id) {
        try {
            return repositorioIncidencias.findByIdWithDetails(id).map(this::mapear);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener incidencia por ID: " + e.getMessage(), e);
        }
    }

    public IncidenciasRespuesta actualizar(String id, IncidenciasDto dto) {
        try {
            Incidencias incidencia = repositorioIncidencias.findByIdWithDetails(id)
                    .orElseThrow(() -> new IllegalArgumentException("Incidencia no encontrada con ID: " + id));

            Pisos piso = repositorioPisos.findById(dto.getIdPiso())
                    .orElseThrow(() -> new IllegalArgumentException("Piso no encontrado con ID: " + dto.getIdPiso()));

            incidencia.setCategoriaIncidencia(dto.getCategoriaIncidencia());
            incidencia.setDescripcionIncidencia(dto.getDescripcionIncidencia());
            incidencia.setObservaciones(dto.getObservaciones());
            incidencia.setMaterialesRequeridos(dto.getMaterialesRequeridos());
            incidencia.setEstadoIncidencia(dto.getEstadoIncidencia());
            incidencia.setHorasTrabajadas(dto.getHorasTrabajadas());
            incidencia.setPresupuesto(dto.getPresupuesto());
            incidencia.setProforma(dto.getProforma());
            incidencia.setPiso(piso);
            if (dto.getFechaIncidencia() != null) {
                incidencia.setFechaIncidencia(dto.getFechaIncidencia());
            }

            return mapear(repositorioIncidencias.save(incidencia));
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar incidencia: " + e.getMessage(), e);
        }
    }

    public List<IncidenciasRespuesta> filtrar(IncidenciasFiltroDto filtro) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("SELECT i FROM Incidencias i ");
            sb.append("JOIN FETCH i.piso p ");
            sb.append("JOIN FETCH p.promocion prom ");
            sb.append("LEFT JOIN FETCH p.propietario prop ");
            sb.append("WHERE 1=1 ");

            Map<String, Object> params = new HashMap<>();

            if (filtro.getNumeroIncidencia() != null && !filtro.getNumeroIncidencia().trim().isEmpty()) {
                sb.append("AND i.numeroIncidencia = :numeroIncidencia ");
                params.put("numeroIncidencia", filtro.getNumeroIncidencia().trim());
            }
            if (filtro.getPiso() != null && !filtro.getPiso().trim().isEmpty()) {
                sb.append("AND p.piso LIKE :piso ");
                params.put("piso", "%" + filtro.getPiso().trim() + "%");
            }
            if (filtro.getPromocion() != null && !filtro.getPromocion().trim().isEmpty()) {
                sb.append("AND prom.promocion LIKE :promocion ");
                params.put("promocion", "%" + filtro.getPromocion().trim() + "%");
            }
            if (filtro.getFechaInicial() != null) {
                sb.append("AND i.fechaIncidencia >= :fechaInicial ");
                params.put("fechaInicial", filtro.getFechaInicial());
            }
            if (filtro.getFechaFinal() != null) {
                sb.append("AND i.fechaIncidencia <= :fechaFinal ");
                params.put("fechaFinal", filtro.getFechaFinal());
            }
            if (filtro.getEstadoIncidencia() != null) {
                sb.append("AND i.estadoIncidencia = :estadoIncidencia ");
                params.put("estadoIncidencia", filtro.getEstadoIncidencia());
            }
            if (filtro.getCategoriaIncidencia() != null) {
                sb.append("AND i.categoriaIncidencia = :categoriaIncidencia ");
                params.put("categoriaIncidencia", filtro.getCategoriaIncidencia());
            }

            var query = entityManager.createQuery(sb.toString(), Incidencias.class);
            params.forEach(query::setParameter);

            return query.getResultList().stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al filtrar incidencias: " + e.getMessage(), e);
        }
    }

    public void importar(MultipartFile archivo, int idPromocion) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(archivo.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Ignorar la primera fila (encabezado) e iterar desde la fila index 1
            for (int fila = 1; fila <= sheet.getLastRowNum(); fila++) {
                Row row = sheet.getRow(fila);

                if (filaVacia(row)) {
                    continue;
                }

                String numeroIncidencia = getString(row.getCell(0)).trim();
                String nombrePiso = getString(row.getCell(1)).trim().toUpperCase();
                String categoriaStr = getString(row.getCell(2));
                String descripcion = getString(row.getCell(3));
                String observaciones = getString(row.getCell(4));
                String materiales = getString(row.getCell(5));
                String estadoStr = getString(row.getCell(6));
                String horasStr = getString(row.getCell(7));                String presupuestoStr = getString(row.getCell(8));
                String proformaStr = getString(row.getCell(9));
                String fechaStr = getString(row.getCell(10));

                CategoriaIncidencia categoria = parseCategoria(categoriaStr);

                if (numeroIncidencia.isEmpty() || nombrePiso.isEmpty() || categoriaStr.trim().isEmpty() || categoria == null) {
                    continue; // Requeridos: Número, Piso/piso y Categoría
                }

                // Buscar el piso asociado por nombre y promoción. Si no existe, se crea automáticamente.
                Pisos piso = repositorioPisos.findByPisoAndPromocionId(nombrePiso, idPromocion)
                        .orElseGet(() -> {
                            Promociones prom = repositorioPromociones.findById(idPromocion).orElse(null);
                            Pisos nuevoPiso = Pisos.builder()
                                    .piso(nombrePiso)
                                    .promocion(prom)
                                    .propietario(null)
                                    .build();
                            return repositorioPisos.save(nuevoPiso);
                        });
                EstadoIncidencia estado = parseEstado(estadoStr);
                HorasTrabajadas horas = parseHoras(horasStr);

                RespuestaSNN presupuesto = parseRespuestaSNN(presupuestoStr);
                RespuestaSNN proforma = parseRespuestaSNN(proformaStr);

                LocalDateTime fechaIncidencia = parseFecha(fechaStr);

                // Construir DTO
                IncidenciasDto dto = IncidenciasDto.builder()
                        .numeroIncidencia(numeroIncidencia)
                        .categoriaIncidencia(categoria)
                        .descripcionIncidencia(descripcion)
                        .observaciones(observaciones)
                        .materialesRequeridos(materiales)
                        .estadoIncidencia(estado)
                        .horasTrabajadas(horas)
                        .presupuesto(presupuesto)
                        .proforma(proforma)
                        .idPiso(piso.getIdPiso())
                        .fechaIncidencia(fechaIncidencia)
                        .build();

                // Reutilizar métodos existentes para insertar o actualizar
                if (repositorioIncidencias.existsById(numeroIncidencia)) {
                    this.actualizar(numeroIncidencia, dto);
                } else {
                    this.insertar(dto);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al importar incidencias desde Excel: " + e.getMessage(), e);
        }
    }

    public ByteArrayResource exportar(int idPromocion) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Incidencias");
            int filaIndex = 0;

            // Fila de Encabezados (sirve como plantilla)
            Row encabezado = sheet.createRow(filaIndex++);
            encabezado.createCell(0).setCellValue("Número Incidencia");
            encabezado.createCell(1).setCellValue("Piso");
            encabezado.createCell(2).setCellValue("Categoría (PARQUET, MARMOL, COCINA, PUERTAS)");
            encabezado.createCell(3).setCellValue("Descripción");
            encabezado.createCell(4).setCellValue("Observaciones");
            encabezado.createCell(5).setCellValue("Materiales Requeridos");
            encabezado.createCell(6).setCellValue("Estado (VISITADO, NO_VISITADO, TERMINADO, PENDIENTE_PRESUPUESTO)");
            encabezado.createCell(7).setCellValue("Horas Trabajadas (1_H, 2_H, 3_H, 4_H, 5_H, 6_H, 7_H, 8_H)");
            encabezado.createCell(8).setCellValue("Presupuesto (SI, NO, NA)");
            encabezado.createCell(9).setCellValue("Proforma (SI, NO, NA)");
            encabezado.createCell(10).setCellValue("Fecha Incidencia");

            List<Incidencias> lista = repositorioIncidencias.findByPromocionId(idPromocion);

            for (Incidencias inc : lista) {
                Row row = sheet.createRow(filaIndex++);
                row.createCell(0).setCellValue(inc.getNumeroIncidencia());
                row.createCell(1).setCellValue(inc.getPiso() != null ? inc.getPiso().getPiso() : "");
                row.createCell(2).setCellValue(inc.getCategoriaIncidencia() != null ? inc.getCategoriaIncidencia().getDescripcion() : "");
                row.createCell(3).setCellValue(inc.getDescripcionIncidencia() != null ? inc.getDescripcionIncidencia() : "");
                row.createCell(4).setCellValue(inc.getObservaciones() != null ? inc.getObservaciones() : "");
                row.createCell(5).setCellValue(inc.getMaterialesRequeridos() != null ? inc.getMaterialesRequeridos() : "");
                row.createCell(6).setCellValue(inc.getEstadoIncidencia() != null ? inc.getEstadoIncidencia().getDescripcion() : "");
                row.createCell(7).setCellValue(inc.getHorasTrabajadas() != null ? inc.getHorasTrabajadas().getDescripcion() : "");
                row.createCell(8).setCellValue(inc.getPresupuesto() != null ? inc.getPresupuesto().getDescripcion() : "");
                row.createCell(9).setCellValue(inc.getProforma() != null ? inc.getProforma().getDescripcion() : "");
                row.createCell(10).setCellValue(inc.getFechaIncidencia() != null 
                        ? inc.getFechaIncidencia().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
            }

            for (int i = 0; i < 11; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(output);
            return new ByteArrayResource(output.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Error al exportar incidencias a Excel: " + e.getMessage(), e);
        }
    }

    private CategoriaIncidencia parseCategoria(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        String val = value.trim().toUpperCase();
        for (CategoriaIncidencia cat : CategoriaIncidencia.values()) {
            if (cat.name().equalsIgnoreCase(val) || cat.getDescripcion().equalsIgnoreCase(val)) {
                return cat;
            }
        }
        return null;
    }

    private EstadoIncidencia parseEstado(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        String val = value.trim().toUpperCase();
        for (EstadoIncidencia est : EstadoIncidencia.values()) {
            if (est.name().equalsIgnoreCase(val) || est.getDescripcion().equalsIgnoreCase(val)) {
                return est;
            }
        }
        return null;
    }

    private HorasTrabajadas parseHoras(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        String val = value.trim().toUpperCase();
        for (HorasTrabajadas h : HorasTrabajadas.values()) {
            if (h.name().equalsIgnoreCase(val) || h.getDescripcion().equalsIgnoreCase(val) 
                    || h.getDescripcion().replaceAll("\\s+", "").equalsIgnoreCase(val.replaceAll("\\s+", ""))) {
                return h;
            }
        }
        return null;
    }

    private RespuestaSNN parseRespuestaSNN(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        String val = value.trim().toUpperCase();
        for (RespuestaSNN s : RespuestaSNN.values()) {
            if (s.name().equalsIgnoreCase(val) || s.getDescripcion().equalsIgnoreCase(val)) {
                return s;
            }
        }
        return null;
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

    private String getString(Cell cell) {
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

    public void eliminar(String id) {
        try {
            repositorioIncidencias.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar incidencia: " + e.getMessage(), e);
        }
    }

    private LocalDateTime parseFecha(String fechaStr) {
        if (fechaStr == null || fechaStr.trim().isEmpty()) {
            return null;
        }
        String text = fechaStr.trim();

        // 1. dd/MM/yyyy HH:mm:ss
        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
        } catch (Exception ignored) {}

        // 2. dd/MM/yyyy HH:mm
        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        } catch (Exception ignored) {}

        // 3. dd/MM/yyyy
        try {
            return LocalDate.parse(text, DateTimeFormatter.ofPattern("dd/MM/yyyy")).atStartOfDay();
        } catch (Exception ignored) {}

        // 4. yyyy-MM-dd HH:mm:ss
        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (Exception ignored) {}

        // 5. yyyy-MM-dd
        try {
            return LocalDate.parse(text, DateTimeFormatter.ofPattern("yyyy-MM-dd")).atStartOfDay();
        } catch (Exception ignored) {}

        // 6. ISO_LOCAL_DATE_TIME
        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception ignored) {}

        return null;
    }

    private IncidenciasRespuesta mapear(Incidencias inc) {
        PisosRespuesta pisoResp = null;
        if (inc.getPiso() != null) {
            pisoResp = PisosRespuesta.builder()
                    .idPiso(inc.getPiso().getIdPiso())
                    .piso(inc.getPiso().getPiso())
                    .promocion(inc.getPiso().getPromocion() != null ? inc.getPiso().getPromocion().getPromocion() : null)
                    .propietario(inc.getPiso().getPropietario() != null ? inc.getPiso().getPropietario().getNombre() : null)
                    .telefonoPropietario(inc.getPiso().getPropietario() != null ? inc.getPiso().getPropietario().getTelefono() : null)
                    .build();
        }

        return IncidenciasRespuesta.builder()
                .numeroIncidencia(inc.getNumeroIncidencia())
                .estado(inc.getEstadoIncidencia() != null ? inc.getEstadoIncidencia().getDescripcion() : null)
                .pisos(pisoResp)
                .categoria(inc.getCategoriaIncidencia() != null ? inc.getCategoriaIncidencia().getDescripcion() : null)
                .observacion(inc.getObservaciones())
                .descripcion(inc.getDescripcionIncidencia())
                .materialesRequeridos(inc.getMaterialesRequeridos())
                .presupuesto(inc.getPresupuesto() != null ? inc.getPresupuesto().getDescripcion() : null)
                .proforma(inc.getProforma() != null ? inc.getProforma().getDescripcion() : null)
                .horas(inc.getHorasTrabajadas() != null ? inc.getHorasTrabajadas().getDescripcion() : null)
                .fechaIncidencia(inc.getFechaIncidencia())
                .build();
    }

    public long obtenerCantidadPorPromocion(int idPromocion) {
        try {
            return repositorioIncidencias.countByPromocionId(idPromocion);
        } catch (Exception e) {
            throw new RuntimeException("Error al contar incidencias por promoción: " + e.getMessage(), e);
        }
    }
}
