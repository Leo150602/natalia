package com.proyect.main.modelos.enums;

public enum RolUsuario {
    ADMINISTRADOR("Administrador"),
    DESARROLLADOR("Desarrollador"),
    CLIENTE("Cliente"),
    TECNICO("Técnico"),
    EMPLEADO("Empleado");

    private final String descripcion;

    RolUsuario(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
