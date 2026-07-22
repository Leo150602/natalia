package com.proyect.main.servicios;

import com.proyect.main.modelos.Personas;
import com.proyect.main.modelos.Incidencias;
import com.proyect.main.modelos.Visitas;
import com.proyect.main.modelos.enums.TipoPersonas;
import com.proyect.main.modelos.dtos.entrada.VisitasDto;
import com.proyect.main.modelos.dtos.salida.VisitasRespuesta;
import com.proyect.main.repositorios.IRepositorioPersonas;
import com.proyect.main.repositorios.IRepositorioIncidencias;
import com.proyect.main.repositorios.IRepositorioVisitas;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicioVisitas {

    private final IRepositorioVisitas repositorioVisitas;
    private final IRepositorioPersonas repositorioPersonas;
    private final IRepositorioIncidencias repositorioIncidencias;

    public VisitasRespuesta insertar(VisitasDto dto) {
        try {
            Personas tecnico = repositorioPersonas.findById(dto.getIdTecnico())
                    .orElseThrow(() -> new IllegalArgumentException("Técnico no encontrado con ID: " + dto.getIdTecnico()));

            // Validar que la persona sea un TECNICO
            if (tecnico.getTipoPersonas() != TipoPersonas.TECNICO) {
                throw new IllegalArgumentException("La persona asignada con ID " + dto.getIdTecnico() +
                        " no es del tipo TECNICO. Tipo actual: " + tecnico.getTipoPersonas());
            }

            Incidencias incidencia = repositorioIncidencias.findById(dto.getNumeroIncidencia())
                    .orElseThrow(() -> new IllegalArgumentException("Incidencia no encontrada con número: " + dto.getNumeroIncidencia()));

            Visitas visita = Visitas.builder()
                    .observaciones(dto.getObservaciones())
                    .diaVisita(dto.getDiaVisita())
                    .estadoVisita(dto.getEstadoVisita())
                    .tecnico(tecnico)
                    .incidencia(incidencia)
                    .build();

            return mapear(repositorioVisitas.save(visita));
        } catch (Exception e) {
            throw new RuntimeException("Error al insertar visita: " + e.getMessage(), e);
        }
    }

    public List<VisitasRespuesta> obtenerTodos() {
        try {
            return repositorioVisitas.findAllWithDetails().stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener visitas: " + e.getMessage(), e);
        }
    }

    public Optional<VisitasRespuesta> obtenerPorId(int id) {
        try {
            return repositorioVisitas.findByIdWithDetails(id).map(this::mapear);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener visita por ID: " + e.getMessage(), e);
        }
    }

    public VisitasRespuesta actualizar(int id, VisitasDto dto) {
        try {
            Visitas visita = repositorioVisitas.findByIdWithDetails(id)
                    .orElseThrow(() -> new IllegalArgumentException("Visita no encontrada con ID: " + id));

            Personas tecnico = repositorioPersonas.findById(dto.getIdTecnico())
                    .orElseThrow(() -> new IllegalArgumentException("Técnico no encontrado con ID: " + dto.getIdTecnico()));

            // Validar que la persona sea un TECNICO
            if (tecnico.getTipoPersonas() != TipoPersonas.TECNICO) {
                throw new IllegalArgumentException("La persona asignada con ID " + dto.getIdTecnico() +
                        " no es del tipo TECNICO. Tipo actual: " + tecnico.getTipoPersonas());
            }

            Incidencias incidencia = repositorioIncidencias.findById(dto.getNumeroIncidencia())
                    .orElseThrow(() -> new IllegalArgumentException("Incidencia no encontrada con número: " + dto.getNumeroIncidencia()));

            visita.setObservaciones(dto.getObservaciones());
            visita.setDiaVisita(dto.getDiaVisita());
            visita.setEstadoVisita(dto.getEstadoVisita());
            visita.setTecnico(tecnico);
            visita.setIncidencia(incidencia);

            return mapear(repositorioVisitas.save(visita));
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar visita: " + e.getMessage(), e);
        }
    }

    public void eliminar(int id) {
        try {
            repositorioVisitas.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar visita: " + e.getMessage(), e);
        }
    }

    public List<VisitasRespuesta> obtenerPorPromocion(int idPromocion) {
        try {
            return repositorioVisitas.findByPromocionId(idPromocion).stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener visitas por promoción: " + e.getMessage(), e);
        }
    }

    private VisitasRespuesta mapear(Visitas visita) {
        String pisoNombre = null;
        String promocionNombre = null;
        if (visita.getIncidencia() != null && visita.getIncidencia().getPiso() != null) {
            pisoNombre = visita.getIncidencia().getPiso().getPiso();
            if (visita.getIncidencia().getPiso().getPromocion() != null) {
                promocionNombre = visita.getIncidencia().getPiso().getPromocion().getPromocion();
            }
        }

        return VisitasRespuesta.builder()
                .idVisita(visita.getIdVisita())
                .observaciones(visita.getObservaciones())
                .diaVisita(visita.getDiaVisita())
                .estadoVisita(visita.getEstadoVisita() != null ? visita.getEstadoVisita().getDescripcion() : null)
                .tecnicoNombre(visita.getTecnico() != null ? visita.getTecnico().getNombre() : null)
                .tecnicoTelefono(visita.getTecnico() != null ? visita.getTecnico().getTelefono() : null)
                .numeroIncidencia(visita.getIncidencia() != null ? visita.getIncidencia().getNumeroIncidencia() : null)
                .piso(pisoNombre)
                .promocion(promocionNombre)
                .build();
    }

    public List<VisitasRespuesta> obtenerRecientesPorPromocion(int idPromocion, int limite) {
        try {
            return repositorioVisitas.findRecentByPromocionId(idPromocion, PageRequest.of(0, limite)).stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener visitas recientes por promoción: " + e.getMessage(), e);
        }
    }
}
