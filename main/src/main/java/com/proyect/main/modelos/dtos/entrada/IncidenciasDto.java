package com.proyect.main.modelos.dtos.entrada;

import com.proyect.main.modelos.enums.CategoriaIncidencia;
import com.proyect.main.modelos.enums.EstadoIncidencia;
import com.proyect.main.modelos.enums.HorasTrabajadas;
import com.proyect.main.modelos.enums.RespuestaSNN;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class IncidenciasDto {

    private String numeroIncidencia;
    private CategoriaIncidencia categoriaIncidencia;
    private String descripcionIncidencia;
    private String observaciones;
    private String materialesRequeridos;
    private EstadoIncidencia estadoIncidencia;
    private HorasTrabajadas horasTrabajadas;
    private RespuestaSNN presupuesto;
    private RespuestaSNN proforma;
    private int idPiso;
    private LocalDateTime fechaIncidencia;

}
