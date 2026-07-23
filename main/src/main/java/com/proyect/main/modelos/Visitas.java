package com.proyect.main.modelos;
import com.proyect.main.modelos.enums.EstadoVisita;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "Visitas")
public class Visitas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idVisita;

    @Column()
    private String observaciones;

    @Column(name = "dia_visita")
    private LocalDateTime diaVisita;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoVisita estadoVisita;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idPersona")
    private Personas tecnico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idIncidencia")
    private Incidencias incidencia;

}
