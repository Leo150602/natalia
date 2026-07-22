package com.proyect.main.servicios;

import com.proyect.main.modelos.Promotoras;
import com.proyect.main.modelos.dtos.entrada.PromotorasDto;
import com.proyect.main.modelos.dtos.salida.PromotorasRespuesta;
import com.proyect.main.repositorios.IRepositorioPromotoras;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicioPromotoras {

    private final IRepositorioPromotoras repositorioPromotoras;

    public PromotorasRespuesta insertar(PromotorasDto dto) {
        try {
            Optional<Promotoras> existente = repositorioPromotoras.findByPromotora(dto.getPromotora());
            if (existente.isPresent()) {
                return mapear(existente.get());
            }
            Promotoras promotora = Promotoras.builder()
                    .promotora(dto.getPromotora())
                    .build();
            return mapear(repositorioPromotoras.save(promotora));
        } catch (Exception e) {
            throw new RuntimeException("Error al insertar promotora: " + e.getMessage(), e);
        }
    }

    public List<PromotorasRespuesta> obtenerTodos() {
        try {
            return repositorioPromotoras.findAll().stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener promotoras: " + e.getMessage(), e);
        }
    }

    public Optional<PromotorasRespuesta> obtenerPorId(int id) {
        try {
            return repositorioPromotoras.findById(id).map(this::mapear);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener promotora por ID: " + e.getMessage(), e);
        }
    }

    public PromotorasRespuesta actualizar(int id, PromotorasDto dto) {
        try {
            Promotoras promotora = repositorioPromotoras.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Promotora no encontrada con ID: " + id));
            promotora.setPromotora(dto.getPromotora());
            return mapear(repositorioPromotoras.save(promotora));
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar promotora: " + e.getMessage(), e);
        }
    }

    private PromotorasRespuesta mapear(Promotoras promotora) {
        return PromotorasRespuesta.builder()
                .idPromotora(promotora.getIdPromotora())
                .promotora(promotora.getPromotora())
                .build();
    }
}
