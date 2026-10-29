package com.proyect.main.servicios;

import com.proyect.main.modelos.Incidencias;
import com.proyect.main.modelos.Pisos;
import com.proyect.main.modelos.Promociones;
import com.proyect.main.modelos.Usuario;
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
import com.proyect.main.repositorios.IRepositorioVisitas;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(ServicioIncidencias.class);

    private final IRepositorioIncidencias repositorioIncidencias;
    private final IRepositorioPisos repositorioPisos;
    private final IRepositorioPromociones repositorioPromociones;
    private final IRepositorioVisitas repositorioVisitas;
    private final ServicioIncidenciaDocumento servicioIncidenciaDocumento;

    @PersistenceContext
    private EntityManager entityManager;

    public IncidenciasRespuesta insertar(IncidenciasDto dto) {
        try {
            Pisos piso = repositorioPisos.findById(dto.getIdPiso())
                    .orElseThrow(() -> new IllegalArgumentException("Piso no encontrado con ID: " + dto.getIdPiso()));

            // Validar unicidad del número de incidencia dentro de la misma promotora
            if (piso.getPromocion() != null && piso.getPromocion().getPromotora() != null) {
                int idPromotora = piso.getPromocion().getPromotora().getIdPromotora();
                List<Incidencias> duplicadas = repositorioIncidencias
                        .findByNumeroIncidenciaAndPromotoraId(dto.getNumeroIncidencia(), idPromotora);
                if (!duplicadas.isEmpty()) {
                    throw new IllegalArgumentException("Ya existe una incidencia con el número '" + 
                            dto.getNumeroIncidencia() + "' para la promotora '" + 
                            piso.getPromocion().getPromotora().getPromotora() + "'.");
                }
            }

            Usuario usr = ServicioUsuario.getUsuarioLogeado();
            if (usr == null) {
                usr = entityManager.find(Usuario.class, 6); // default fallback user
            }

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
                    .usuarioActualizo(usr)
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
        return obtenerPorPromocion(idPromocion, false);
    }

    public List<IncidenciasRespuesta> obtenerPorPromocion(int idPromocion, boolean incluirSolicitudes) {
        try {
            List<Incidencias> lista = incluirSolicitudes 
                    ? repositorioIncidencias.findByPromocionIdAllStates(idPromocion)
                    : repositorioIncidencias.findByPromocionId(idPromocion);
            return lista.stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener incidencias por promoción: " + e.getMessage(), e);
        }
    }

    public Optional<IncidenciasRespuesta> obtenerPorId(int id) {
        try {
            return repositorioIncidencias.findByIdWithDetails(id).map(this::mapear);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener incidencia por ID: " + e.getMessage(), e);
        }
    }

    public IncidenciasRespuesta actualizar(int id, IncidenciasDto dto) {
        try {
            Incidencias incidencia = repositorioIncidencias.findByIdWithDetails(id)
                    .orElseThrow(() -> new IllegalArgumentException("Incidencia no encontrada con ID: " + id));

            Pisos piso = repositorioPisos.findById(dto.getIdPiso())
                    .orElseThrow(() -> new IllegalArgumentException("Piso no encontrado con ID: " + dto.getIdPiso()));

            // Validar unicidad del número de incidencia dentro de la misma promotora (excluyendo la actual)
            if (piso.getPromocion() != null && piso.getPromocion().getPromotora() != null) {
                int idPromotora = piso.getPromocion().getPromotora().getIdPromotora();
                List<Incidencias> duplicadas = repositorioIncidencias
                        .findByNumeroIncidenciaAndPromotoraId(dto.getNumeroIncidencia(), idPromotora);
                boolean isDuplicate = duplicadas.stream().anyMatch(i -> i.getIdIncidencia() != id);
                if (isDuplicate) {
                    throw new IllegalArgumentException("Ya existe otra incidencia con el número '" + 
                            dto.getNumeroIncidencia() + "' para la promotora '" + 
                            piso.getPromocion().getPromotora().getPromotora() + "'.");
                }
            }

            // Comparamos los campos para ver si hay cambios
            boolean changed = false;

            if (incidencia.getCategoriaIncidencia() != dto.getCategoriaIncidencia()) {
                incidencia.setCategoriaIncidencia(dto.getCategoriaIncidencia());
                changed = true;
            }
            if (!java.util.Objects.equals(incidencia.getDescripcionIncidencia(), dto.getDescripcionIncidencia())) {
                incidencia.setDescripcionIncidencia(dto.getDescripcionIncidencia());
                changed = true;
            }
            if (!java.util.Objects.equals(incidencia.getObservaciones(), dto.getObservaciones())) {
                incidencia.setObservaciones(dto.getObservaciones());
                changed = true;
            }
            if (!java.util.Objects.equals(incidencia.getMaterialesRequeridos(), dto.getMaterialesRequeridos())) {
                incidencia.setMaterialesRequeridos(dto.getMaterialesRequeridos());
                changed = true;
            }
            if (incidencia.getEstadoIncidencia() != dto.getEstadoIncidencia()) {
                incidencia.setEstadoIncidencia(dto.getEstadoIncidencia());
                changed = true;
            }
            if (incidencia.getHorasTrabajadas() != dto.getHorasTrabajadas()) {
                incidencia.setHorasTrabajadas(dto.getHorasTrabajadas());
                changed = true;
            }
            if (incidencia.getPresupuesto() != dto.getPresupuesto()) {
                incidencia.setPresupuesto(dto.getPresupuesto());
                changed = true;
            }
            if (incidencia.getProforma() != dto.getProforma()) {
                incidencia.setProforma(dto.getProforma());
                changed = true;
            }
            if (incidencia.getPiso() == null || incidencia.getPiso().getIdPiso() != piso.getIdPiso()) {
                incidencia.setPiso(piso);
                changed = true;
            }
            if (dto.getFechaIncidencia() != null && !dto.getFechaIncidencia().equals(incidencia.getFechaIncidencia())) {
                incidencia.setFechaIncidencia(dto.getFechaIncidencia());
                changed = true;
            }

            if (changed) {
                incidencia.setFechaActualizacion(LocalDateTime.now());
                Usuario usr = ServicioUsuario.getUsuarioLogeado();
                if (usr == null) {
                    usr = entityManager.find(Usuario.class, 6); // default fallback user
                }
                incidencia.setUsuarioActualizo(usr);
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
            sb.append("JOIN FETCH prom.promotora pr ");
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
        log.info("--- INICIO IMPORTACIÓN DE INCIDENCIAS ---");
        log.info("Archivo: {}", archivo.getOriginalFilename());
        log.info("Promoción ID: {}", idPromocion);

        int totalFilas = 0;
        int subidosExito = 0; // nuevos insertados
        int actualizadosExito = 0; // actualizados con cambios
        int sinCambiosExito = 0; // sin cambios
        int noSubidos = 0;

        List<String> detallesExito = new java.util.ArrayList<>();
        List<String> detallesFallo = new java.util.ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(archivo.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int fila = 1; fila <= sheet.getLastRowNum(); fila++) {
                Row row = sheet.getRow(fila);

                if (filaVacia(row)) {
                    continue;
                }

                totalFilas++;
                String numeroIncidencia = "";
                String nombrePiso = "";
                String categoriaStr = "";
                try {
                    numeroIncidencia = getString(row.getCell(0)).trim();
                    nombrePiso = getString(row.getCell(1)).trim().toUpperCase();
                    categoriaStr = getString(row.getCell(2));
                    String descripcion = getString(row.getCell(3));
                    String observaciones = getString(row.getCell(4));
                    String materiales = getString(row.getCell(5));
                    String estadoStr = getString(row.getCell(6));
                    String horasStr = getString(row.getCell(7));
                    String presupuestoStr = getString(row.getCell(8));
                    String proformaStr = getString(row.getCell(9));
                    String fechaStr = getString(row.getCell(10));

                    CategoriaIncidencia categoria = parseCategoria(categoriaStr);

                    if (numeroIncidencia.isEmpty() || nombrePiso.isEmpty() || categoriaStr.trim().isEmpty() || categoria == null) {
                        StringBuilder reason = new StringBuilder("Campos requeridos faltantes o inválidos:");
                        if (numeroIncidencia.isEmpty()) reason.append(" Número de incidencia vacío.");
                        if (nombrePiso.isEmpty()) reason.append(" Nombre de piso vacío.");
                        if (categoriaStr.trim().isEmpty()) reason.append(" Categoría vacía.");
                        else if (categoria == null) reason.append(" Categoría '").append(categoriaStr).append("' no válida.");
                        
                        detallesFallo.add("Fila " + fila + " [Incidencia: '" + numeroIncidencia + "', Piso: '" + nombrePiso + "'] -> No subido: " + reason.toString());
                        noSubidos++;
                        continue;
                    }

                    final String finalNombrePiso = nombrePiso;
                    Pisos piso = repositorioPisos.findByPisoAndPromocionId(nombrePiso, idPromocion)
                            .orElseGet(() -> {
                                Promociones prom = repositorioPromociones.findById(idPromocion).orElse(null);
                                Pisos nuevoPiso = Pisos.builder()
                                        .piso(finalNombrePiso)
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

                    String accion;
                    Optional<Incidencias> existenteOpt = repositorioIncidencias.findByNumeroIncidenciaAndPromocionId(numeroIncidencia, idPromocion);
                    if (existenteOpt.isPresent()) {
                        Incidencias exc = existenteOpt.get();
                        boolean hasChanges = false;

                        if (exc.getCategoriaIncidencia() != dto.getCategoriaIncidencia()) hasChanges = true;
                        if (!java.util.Objects.equals(exc.getDescripcionIncidencia(), dto.getDescripcionIncidencia())) hasChanges = true;
                        if (!java.util.Objects.equals(exc.getObservaciones(), dto.getObservaciones())) hasChanges = true;
                        if (!java.util.Objects.equals(exc.getMaterialesRequeridos(), dto.getMaterialesRequeridos())) hasChanges = true;
                        if (exc.getEstadoIncidencia() != dto.getEstadoIncidencia()) hasChanges = true;
                        if (exc.getHorasTrabajadas() != dto.getHorasTrabajadas()) hasChanges = true;
                        if (exc.getPresupuesto() != dto.getPresupuesto()) hasChanges = true;
                        if (exc.getProforma() != dto.getProforma()) hasChanges = true;
                        if (exc.getPiso() == null || exc.getPiso().getIdPiso() != dto.getIdPiso()) hasChanges = true;
                        if (dto.getFechaIncidencia() != null && !dto.getFechaIncidencia().equals(exc.getFechaIncidencia())) hasChanges = true;

                        if (hasChanges) {
                            this.actualizar(exc.getIdIncidencia(), dto);
                            accion = "Actualizada";
                            actualizadosExito++;
                        } else {
                            accion = "Queda igual (sin cambios)";
                            sinCambiosExito++;
                        }
                    } else {
                        this.insertar(dto);
                        accion = "Insertada";
                        subidosExito++;
                    }
                    detallesExito.add("Fila " + fila + " [Incidencia: '" + numeroIncidencia + "', Piso: '" + nombrePiso + "'] -> " + accion + " exitosamente.");
                } catch (Exception e) {
                    detallesFallo.add("Fila " + fila + " [Incidencia: '" + numeroIncidencia + "', Piso: '" + nombrePiso + "'] -> Error: " + e.getMessage());
                    noSubidos++;
                }
            }

            log.info("Procesamiento de registros completado. Detalles:");
            for (String msg : detallesExito) {
                log.info("  {}", msg);
            }

            if (noSubidos > 0) {
                log.warn("Registros NO subidos por error ({}):", noSubidos);
                for (String msg : detallesFallo) {
                    log.warn("  {}", msg);
                }
            }

            log.info("Resumen de importación: Total filas procesadas = {}, Insertadas = {}, Actualizadas = {}, Sin cambios = {}, Fallas = {}", 
                    totalFilas, subidosExito, actualizadosExito, sinCambiosExito, noSubidos);
            log.info("--- FIN IMPORTACIÓN DE INCIDENCIAS ---");
        } catch (Exception e) {
            log.error("Error crítico durante la importación de incidencias desde Excel: {}", e.getMessage(), e);
            throw new RuntimeException("Error al importar incidencias desde Excel: " + e.getMessage(), e);
        }
    }

    public ByteArrayResource exportar(int idPromocion, com.proyect.main.modelos.dtos.entrada.IncidenciasFiltroDto filtro, boolean forzar) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        
        try {
            Sheet sheet = workbook.createSheet("Incidencias");
            int filaIndex = 0;

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

            // Construir consulta dinámica basada en filtros
            StringBuilder sb = new StringBuilder();
            sb.append("SELECT i FROM Incidencias i ");
            sb.append("JOIN FETCH i.piso p ");
            sb.append("JOIN FETCH p.promocion prom ");
            sb.append("WHERE prom.idPromocion = :idPromocion ");

            Map<String, Object> params = new java.util.HashMap<>();
            params.put("idPromocion", idPromocion);

            if (filtro.getNumeroIncidencia() != null && !filtro.getNumeroIncidencia().trim().isEmpty()) {
                sb.append("AND i.numeroIncidencia = :numeroIncidencia ");
                params.put("numeroIncidencia", filtro.getNumeroIncidencia().trim());
            }
            if (filtro.getPiso() != null && !filtro.getPiso().trim().isEmpty()) {
                sb.append("AND p.piso LIKE :piso ");
                params.put("piso", "%" + filtro.getPiso().trim() + "%");
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

            List<Incidencias> lista = query.getResultList();
            if (lista.isEmpty() && !forzar) {
                throw new IllegalArgumentException("No se encontraron registros para exportar con los filtros seleccionados.");
            }

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

            if (!lista.isEmpty()) {
                for (int i = 0; i < 11; i++) {
                    sheet.autoSizeColumn(i);
                }
            }

            workbook.write(output);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error al exportar incidencias a Excel: " + e.getMessage(), e);
        } finally {
            try {
                workbook.close();
            } catch (Exception ignored) {}
            try {
                output.close();
            } catch (Exception ignored) {}
        }
        
        return new ByteArrayResource(output.toByteArray());
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
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    java.util.Date date = cell.getDateCellValue();
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
                    yield sdf.format(date);
                } else {
                    yield String.valueOf((long) cell.getNumericCellValue());
                }
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    public void eliminar(int id) {
        try {
            // 1. Buscar y eliminar todas las relaciones de documentos de esta incidencia (incluye borrar de GCS)
            List<com.proyect.main.modelos.IncidenciaDocumento> relaciones = 
                servicioIncidenciaDocumento.listarPorIncidencia(id);
            for (com.proyect.main.modelos.IncidenciaDocumento rel : relaciones) {
                servicioIncidenciaDocumento.eliminarAsociacion(rel.getId());
            }

            // 1.5. Eliminar todas las visitas asociadas a la incidencia
            repositorioVisitas.deleteByIncidenciaId(id);

            // 2. Eliminar la incidencia de la base de datos
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

        // 4-digit year patterns
        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
        } catch (Exception ignored) {}

        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        } catch (Exception ignored) {}

        try {
            return LocalDate.parse(text, DateTimeFormatter.ofPattern("dd/MM/yyyy")).atStartOfDay();
        } catch (Exception ignored) {}

        // 2-digit year patterns (e.g. yy/MM/dd or dd/MM/yy)
        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("dd/MM/yy HH:mm:ss"));
        } catch (Exception ignored) {}

        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("dd/MM/yy HH:mm"));
        } catch (Exception ignored) {}

        try {
            return LocalDate.parse(text, DateTimeFormatter.ofPattern("dd/MM/yy")).atStartOfDay();
        } catch (Exception ignored) {}

        // yyyy-MM-dd patterns
        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (Exception ignored) {}

        try {
            return LocalDate.parse(text, DateTimeFormatter.ofPattern("yyyy-MM-dd")).atStartOfDay();
        } catch (Exception ignored) {}

        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception ignored) {}

        return null;
    }

    IncidenciasRespuesta mapear(Incidencias inc) {
        PisosRespuesta pisoResp = null;
        if (inc.getPiso() != null) {
            pisoResp = PisosRespuesta.builder()
                    .idPiso(inc.getPiso().getIdPiso())
                    .piso(inc.getPiso().getPiso())
                    .promocion(inc.getPiso().getPromocion() != null ? inc.getPiso().getPromocion().getPromocion() : null)
                    .promotora(inc.getPiso().getPromocion() != null && inc.getPiso().getPromocion().getPromotora() != null ? inc.getPiso().getPromocion().getPromotora().getPromotora() : null)
                    .propietario(inc.getPiso().getPropietario() != null ? inc.getPiso().getPropietario().getNombre() : null)
                    .telefonoPropietario(inc.getPiso().getPropietario() != null ? inc.getPiso().getPropietario().getTelefono() : null)
                    .build();
        }

        return IncidenciasRespuesta.builder()
                .idIncidencia(inc.getIdIncidencia())
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
                .fechaActualizacion(inc.getFechaActualizacion())
                .solicitante(inc.getUsuarioActualizo() != null ? 
                    (inc.getUsuarioActualizo().getNombre() != null && !inc.getUsuarioActualizo().getNombre().isEmpty() ? 
                        inc.getUsuarioActualizo().getNombre() : inc.getUsuarioActualizo().getUsername()) : null)
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
