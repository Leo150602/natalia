package com.proyect.main.servicios;

import com.proyect.main.modelos.Promociones;
import com.proyect.main.modelos.Promotoras;
import com.proyect.main.modelos.dtos.entrada.PromocionesDto;
import com.proyect.main.modelos.dtos.salida.PromocionItem;
import com.proyect.main.modelos.dtos.salida.PromocionesRespuesta;
import com.proyect.main.repositorios.IRepositorioIncidencias;
import com.proyect.main.repositorios.IRepositorioPisos;
import com.proyect.main.repositorios.IRepositorioPromociones;
import com.proyect.main.repositorios.IRepositorioPromotoras;
import com.proyect.main.repositorios.IRepositorioVisitas;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicioPromociones {

    private final IRepositorioPromociones repositorioPromociones;
    private final IRepositorioPromotoras repositorioPromotoras;
    private final IRepositorioPisos repositorioPisos;
    private final IRepositorioIncidencias repositorioIncidencias;
    private final IRepositorioVisitas repositorioVisitas;
    private final ServicioIncidenciaDocumento servicioIncidenciaDocumento;

    public PromocionesRespuesta insertar(PromocionesDto dto) {
        try {
            // Buscar o crear la promotora
            Promotoras promotora = repositorioPromotoras.findByPromotora(dto.getPromotora())
                    .orElseGet(() -> repositorioPromotoras.save(
                            Promotoras.builder().promotora(dto.getPromotora()).build()
                    ));

            // Buscar si ya existe la promoción
            Optional<Promociones> existente = repositorioPromociones.findByPromocion(dto.getPromocion());
            if (existente.isPresent()) {
                return mapearIndividual(existente.get());
            }

            Promociones promocion = Promociones.builder()
                    .promocion(dto.getPromocion())
                    .promotora(promotora)
                    .direccion(dto.getDireccion())
                    .coordenadas(dto.getCoordenadas())
                    .color(dto.getColor())
                    .build();

            return mapearIndividual(repositorioPromociones.save(promocion));
        } catch (Exception e) {
            throw new RuntimeException("Error al insertar promoción: " + e.getMessage(), e);
        }
    }

    public List<PromocionesRespuesta> obtenerTodos() {
        try {
            List<Promociones> todas = repositorioPromociones.findAllWithPromotora();
            
            // Agrupar las promociones por el nombre de la promotora
            Map<String, List<PromocionItem>> agrupadas = todas.stream()
                    .collect(Collectors.groupingBy(
                            p -> p.getPromotora().getPromotora(),
                            Collectors.mapping(
                                    p -> PromocionItem.builder()
                                            .idPromocion(p.getIdPromocion())
                                            .nombre(p.getPromocion())
                                            .direccion(p.getDireccion())
                                            .coordenadas(p.getCoordenadas())
                                            .color(p.getColor())
                                            .build(),
                                    Collectors.toList()
                            )
                    ));

            return agrupadas.entrySet().stream()
                    .map(entry -> PromocionesRespuesta.builder()
                            .promotora(entry.getKey())
                            .promocion(entry.getValue())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener promociones agrupadas: " + e.getMessage(), e);
        }
    }

    public Optional<PromocionesRespuesta> obtenerPorId(int id) {
        try {
            return repositorioPromociones.findByIdWithPromotora(id).map(this::mapearIndividual);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener promoción por ID: " + e.getMessage(), e);
        }
    }

    public PromocionesRespuesta actualizar(int id, PromocionesDto dto) {
        try {
            Promociones promocion = repositorioPromociones.findByIdWithPromotora(id)
                    .orElseThrow(() -> new IllegalArgumentException("Promoción no encontrada con ID: " + id));

            // Buscar o crear la promotora si cambió
            if (!promocion.getPromotora().getPromotora().equals(dto.getPromotora())) {
                Promotoras promotora = repositorioPromotoras.findByPromotora(dto.getPromotora())
                        .orElseGet(() -> repositorioPromotoras.save(
                                Promotoras.builder().promotora(dto.getPromotora()).build()
                        ));
                promocion.setPromotora(promotora);
            }

            promocion.setPromocion(dto.getPromocion());
            promocion.setDireccion(dto.getDireccion());
            promocion.setCoordenadas(dto.getCoordenadas());
            promocion.setColor(dto.getColor());
            return mapearIndividual(repositorioPromociones.save(promocion));
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar promoción: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void eliminar(int id) {
        try {
            // 1. Eliminar documentos asociados a las incidencias de esta promoción
            List<Integer> idsIncidencias = repositorioIncidencias.findIdsByPromocionId(id);
            for (Integer idIncidencia : idsIncidencias) {
                List<com.proyect.main.modelos.IncidenciaDocumento> relaciones =
                        servicioIncidenciaDocumento.listarPorIncidencia(idIncidencia);
                for (com.proyect.main.modelos.IncidenciaDocumento rel : relaciones) {
                    servicioIncidenciaDocumento.eliminarAsociacion(rel.getId());
                }
            }

            // 2. Eliminar todas las visitas asociadas a las incidencias de esta promoción
            repositorioVisitas.deleteByPromocionId(id);

            // 3. Eliminar todas las incidencias asociadas a los pisos de esta promoción
            repositorioIncidencias.deleteByPromocionId(id);

            // 4. Eliminar todos los pisos asociados a esta promoción
            repositorioPisos.deleteByPromocionId(id);

            // 5. Eliminar la promoción
            repositorioPromociones.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar promoción: " + e.getMessage(), e);
        }
    }

    private PromocionesRespuesta mapearIndividual(Promociones promocion) {
        return PromocionesRespuesta.builder()
                .promotora(promocion.getPromotora().getPromotora())
                .promocion(Collections.singletonList(
                        PromocionItem.builder()
                                .idPromocion(promocion.getIdPromocion())
                                .nombre(promocion.getPromocion())
                                .direccion(promocion.getDireccion())
                                .coordenadas(promocion.getCoordenadas())
                                .color(promocion.getColor())
                                .build()
                ))
                .build();
    }
}
