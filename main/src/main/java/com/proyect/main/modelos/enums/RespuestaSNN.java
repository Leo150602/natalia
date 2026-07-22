package com.proyect.main.modelos.enums;

public enum RespuestaSNN {
    SI("Sí"),
    NO("No"),
    NA("N/A");

    private final String descripcion;

    RespuestaSNN(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
