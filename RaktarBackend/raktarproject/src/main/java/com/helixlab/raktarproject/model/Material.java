package com.helixlab.raktarproject.model;

public enum Material {
    Metal("Metal"),
    Wood("Wood"),
    Titanium("Titanium"),
    Plastic("Plastic");

    private final String value;

    Material(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Material fromValue(String value) {
        for (Material material : Material.values()) {
            if (material.getValue().equalsIgnoreCase(value)) {
                return material;
            }
        }
        throw new IllegalArgumentException("Unknown material: " + value);
    }
}