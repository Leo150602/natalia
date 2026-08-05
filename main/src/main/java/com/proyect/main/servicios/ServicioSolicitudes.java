package com.proyect.main.servicios;

import com.proyect.main.modelos.Incidencias;
import com.proyect.main.modelos.Usuario;
import com.proyect.main.modelos.enums.EstadoIncidencia;
import com.proyect.main.modelos.dtos.salida.IncidenciasRespuesta;
import com.proyect.main.repositorios.IRepositorioIncidencias;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicioSolicitudes {

    private final IRepositorioIncidencias repositorioIncidencias;
    private final ServicioIncidencias servicioIncidencias;

    @PersistenceContext
    private EntityManager entityManager;

    public List<IncidenciasRespuesta> listarSolicitudes(Integer idPromocion) {
        return repositorioIncidencias.findSolicitudes(idPromocion).stream()
                .map(servicioIncidencias::mapear)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public void rechazarSolicitud(int id) {
        Incidencias solicitud = repositorioIncidencias.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud no encontrada con ID: " + id));
        solicitud.setEstadoIncidencia(EstadoIncidencia.RECHAZADO);
        solicitud.setFechaActualizacion(LocalDateTime.now());
        Usuario usr = ServicioUsuario.getUsuarioLogeado();
        if (usr == null) {
            usr = entityManager.find(Usuario.class, 6);
        }
        solicitud.setUsuarioActualizo(usr);
        repositorioIncidencias.save(solicitud);
    }

    @org.springframework.transaction.annotation.Transactional
    public void aceptarSolicitud(int id) {
        Incidencias solicitud = repositorioIncidencias.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud no encontrada con ID: " + id));
        solicitud.setEstadoIncidencia(EstadoIncidencia.NO_VISITADO);
        solicitud.setFechaActualizacion(LocalDateTime.now());
        Usuario usr = ServicioUsuario.getUsuarioLogeado();
        if (usr == null) {
            usr = entityManager.find(Usuario.class, 6);
        }
        solicitud.setUsuarioActualizo(usr);
        repositorioIncidencias.save(solicitud);
    }

    @org.springframework.transaction.annotation.Transactional
    public void aceptarMultiples(List<Integer> ids) {
        for (int id : ids) {
            aceptarSolicitud(id);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void rechazarMultiples(List<Integer> ids) {
        for (int id : ids) {
            rechazarSolicitud(id);
        }
    }
}
