package com.proyect.main.modelos.enums;

public enum EstadoVisita {
    PROGRAMADA("Programada"),
    TERMINADA("Terminada"),
    REAGENDAR("Reagendar");

    private final String descripcion;

    EstadoVisita(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
