package com.proyect.main.modelos.dtos.salida;

import lombok.*;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class IncidenciasRespuesta {

    private int idIncidencia;
    private String numeroIncidencia;
    private String estado;
    private PisosRespuesta pisos;
    private String categoria;
    private String observacion;
    private String descripcion;
    private String materialesRequeridos;
    private String presupuesto;
    private String proforma;
    private String horas;
    private LocalDateTime fechaIncidencia;
    private LocalDateTime fechaActualizacion;
    private String solicitante;

}
