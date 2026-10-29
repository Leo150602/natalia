package com.proyect.main.modelos;

import com.proyect.main.modelos.enums.FormatoDocumento;
import com.proyect.main.modelos.enums.TipoDocumento;
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
@Table(name = "Documentos")
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "fecha_montado", nullable = false)
    private LocalDateTime fechaMontado;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_documento", nullable = false)
    private TipoDocumento tipoDocumento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FormatoDocumento formato;

    @Column(nullable = false, length = 1000)
    private String ruta;
}
