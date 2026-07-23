package com.proyect.main.modelos;
import com.proyect.main.modelos.enums.TipoPersonas;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "Personas")
public class Personas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idPersona;

    @Column()
    private String nombre;

    @Column(unique = true)
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoPersonas tipoPersonas;

    @OneToMany(mappedBy = "tecnico", fetch = FetchType.LAZY)
    private List<Visitas> visitas;

    @OneToMany(mappedBy = "propietario", fetch = FetchType.LAZY)
    private List<Pisos> psios;

}
