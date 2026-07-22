package com.proyect.main.modelos.enums;

public enum CategoriaIncidencia {
    PARQUET("Parquet"),
    MARMOL("Mármol"),
    COCINA("Cocina"),
    PUERTAS("Puertas");

    private final String descripcion;

    CategoriaIncidencia(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
