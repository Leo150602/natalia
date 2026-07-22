package com.proyect.main.modelos.enums;

public enum TipoPersonas {
    TECNICO("Técnico"),
    PROPIETARIO("Propietario");

    private final String descripcion;

    TipoPersonas(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
