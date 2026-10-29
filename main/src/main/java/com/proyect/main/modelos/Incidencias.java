package com.proyect.main.modelos;
import com.proyect.main.modelos.enums.CategoriaIncidencia;
import com.proyect.main.modelos.enums.EstadoIncidencia;
import com.proyect.main.modelos.enums.HorasTrabajadas;
import com.proyect.main.modelos.enums.RespuestaSNN;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "Incidencias")
public class Incidencias {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_incidencia")
    private int idIncidencia;

    @Column(name = "numero_incidencia", nullable = false)
    private String numeroIncidencia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaIncidencia categoriaIncidencia;

    @Column(name = "descripcion_incidencia")
    private String descripcionIncidencia;

    @Column()
    private String observaciones;

    @Column(name = "materiales_requeridos")
    private String materialesRequeridos;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private EstadoIncidencia estadoIncidencia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private HorasTrabajadas horasTrabajadas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private RespuestaSNN presupuesto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private RespuestaSNN proforma;

    @Column(name = "fecha_incidencia")
    private LocalDateTime fechaIncidencia;

    @OneToMany(mappedBy = "incidencia", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Visitas> visitas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idPiso", nullable = false)
    private Pisos piso;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_actualizo_id", nullable = true)
    private Usuario usuarioActualizo;

}
