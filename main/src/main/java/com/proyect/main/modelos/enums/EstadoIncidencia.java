package com.proyect.main.modelos.enums;

public enum EstadoIncidencia {
    VISITADO("Visitado"),
    NO_VISITADO("No visitado"),
    TERMINADO("Terminado"),
    PENDIENTE_PRESUPUESTO("Pendiente de presupuesto");

    private final String descripcion;

    EstadoIncidencia(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
