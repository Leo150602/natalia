package com.proyect.main.modelos;

import com.proyect.main.modelos.enums.EstadoDocumentoIncidencia;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "incidencia_documentos")
public class IncidenciaDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_incidencia", nullable = false)
    @JsonIgnore
    private Incidencias incidencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_documento", nullable = false)
    private Documento documento;

    @Column(name = "nombre_subio", nullable = false)
    private String nombreSubio;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoDocumentoIncidencia estado;
}
