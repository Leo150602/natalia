package com.proyect.main.servicios;

import com.proyect.main.modelos.Personas;
import com.proyect.main.modelos.dtos.entrada.PersonasDto;
import com.proyect.main.modelos.dtos.salida.PersonasRespuesta;
import com.proyect.main.repositorios.IRepositorioPersonas;
import com.proyect.main.repositorios.IRepositorioPisos;
import com.proyect.main.repositorios.IRepositorioVisitas;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicioPersonas {

    private final IRepositorioPersonas repositorioPersonas;
    private final IRepositorioPisos repositorioPisos;
    private final IRepositorioVisitas repositorioVisitas;

    public PersonasRespuesta insertar(PersonasDto dto) {
        try {
            Optional<Personas> existente = repositorioPersonas.findByTelefono(dto.getTelefono());
            if (existente.isPresent()) {
                Personas p = existente.get();
                // Si existe pero cambió de nombre o tipo, lo actualizamos
                p.setNombre(dto.getNombre());
                p.setTipoPersonas(dto.getTipoPersonas());
                return mapear(repositorioPersonas.save(p));
            }
            Personas persona = Personas.builder()
                    .nombre(dto.getNombre())
                    .telefono(dto.getTelefono())
                    .tipoPersonas(dto.getTipoPersonas())
                    .build();
            return mapear(repositorioPersonas.save(persona));
        } catch (Exception e) {
            throw new RuntimeException("Error al insertar persona: " + e.getMessage(), e);
        }
    }

    public List<PersonasRespuesta> obtenerTodos() {
        try {
            return repositorioPersonas.findAll().stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener personas: " + e.getMessage(), e);
        }
    }

    public Optional<PersonasRespuesta> obtenerPorId(int id) {
        try {
            return repositorioPersonas.findById(id).map(this::mapear);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener persona por ID: " + e.getMessage(), e);
        }
    }

    public PersonasRespuesta actualizar(int id, PersonasDto dto) {
        try {
            Personas persona = repositorioPersonas.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Persona no encontrada con ID: " + id));
            persona.setNombre(dto.getNombre());
            persona.setTelefono(dto.getTelefono());
            persona.setTipoPersonas(dto.getTipoPersonas());
            return mapear(repositorioPersonas.save(persona));
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar persona: " + e.getMessage(), e);
        }
    }

    public void eliminar(int id) {
        try {
            repositorioPisos.setPropietarioToNull(id);
            repositorioVisitas.setTecnicoToNull(id);
            repositorioPersonas.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar persona: " + e.getMessage(), e);
        }
    }

    public List<PersonasRespuesta> obtenerPropietariosPorPromocion(int idPromocion) {
        try {
            return repositorioPersonas.findOwnersByPromocionId(idPromocion).stream()
                    .map(this::mapear)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener propietarios por promoción: " + e.getMessage(), e);
        }
    }

    private PersonasRespuesta mapear(Personas persona) {
        return PersonasRespuesta.builder()
                .idPersona(persona.getIdPersona())
                .nombre(persona.getNombre())
                .telefono(persona.getTelefono())
                .tipoPersonas(persona.getTipoPersonas() != null ? persona.getTipoPersonas().getDescripcion() : null)
                .build();
    }
}
