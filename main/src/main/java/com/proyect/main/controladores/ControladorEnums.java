package com.proyect.main.controladores;

import com.proyect.main.servicios.ServicioEnums;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enums")
@RequiredArgsConstructor
public class ControladorEnums {

    private final ServicioEnums servicioEnums;

    @GetMapping
    public ResponseEntity<?> obtenerTodosLosEnums() {
        try {
            Map<String, List<Map<String, String>>> enums = servicioEnums.obtenerTodosLosEnums();
            return ResponseEntity.ok(enums);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
