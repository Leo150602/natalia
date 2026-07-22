package com.proyect.main.modelos.enums;

public enum HorasTrabajadas {
    H_1("1_H"),
    H_2("2_H"),
    H_3("3_H"),
    H_4("4_H"),
    H_5("5_H"),
    H_6("6_H"),
    H_7("7_H"),
    H_8("8_H");

    private final String descripcion;

    HorasTrabajadas(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
