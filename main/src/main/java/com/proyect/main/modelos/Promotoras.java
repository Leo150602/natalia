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
@Table(name = "Promotoras")
public class Promotoras {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idPromotora;

    @Column()
    private String promotora;

    @OneToMany(mappedBy = "promotora", fetch = FetchType.LAZY)
    private List<Promociones> promociones;

}
