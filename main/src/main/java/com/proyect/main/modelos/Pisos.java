package com.proyect.main.modelos;
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
@Table(name = "Pisos")
public class Pisos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idPiso;

    @Column()
    private String piso;

    @OneToMany(mappedBy = "piso", fetch = FetchType.LAZY)
    private List<Incidencias> incidencias;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idPromocion")
    private Promociones promocion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idPersona")
    private Personas propietario;
}
