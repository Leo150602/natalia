package com.proyect.main.servicios;

import com.proyect.main.modelos.enums.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ServicioEnums {

    public Map<String, List<Map<String, String>>> obtenerTodosLosEnums() {
        Map<String, List<Map<String, String>>> result = new HashMap<>();

        result.put("categorias", Arrays.stream(CategoriaIncidencia.values())
                .map(e -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("value", e.name());
                    map.put("descripcion", e.getDescripcion());
                    return map;
                })
                .collect(Collectors.toList()));

        result.put("estadosIncidencia", Arrays.stream(EstadoIncidencia.values())
                .map(e -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("value", e.name());
                    map.put("descripcion", e.getDescripcion());
                    return map;
                })
                .collect(Collectors.toList()));

        result.put("estadosVisita", Arrays.stream(EstadoVisita.values())
                .map(e -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("value", e.name());
                    map.put("descripcion", e.getDescripcion());
                    return map;
                })
                .collect(Collectors.toList()));

        result.put("horasTrabajadas", Arrays.stream(HorasTrabajadas.values())
                .map(e -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("value", e.name());
                    map.put("descripcion", e.getDescripcion());
                    return map;
                })
                .collect(Collectors.toList()));

        result.put("tiposPersona", Arrays.stream(TipoPersonas.values())
                .map(e -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("value", e.name());
                    map.put("descripcion", e.getDescripcion());
                    return map;
                })
                .collect(Collectors.toList()));

        result.put("respuestasSNN", Arrays.stream(RespuestaSNN.values())
                .map(e -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("value", e.name());
                    map.put("descripcion", e.getDescripcion());
                    return map;
                })
                .collect(Collectors.toList()));

        return result;
    }
}
