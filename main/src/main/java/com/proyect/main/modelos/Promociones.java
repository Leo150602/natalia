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
@Table(name = "Promociones")
public class Promociones {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idPromocion;

    @Column
    private String promocion;

    @OneToMany(mappedBy = "promocion", fetch = FetchType.LAZY)
    private List<Pisos> pisos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idPromotora")
    private Promotoras promotora;
}
