package com.helixlab.raktarproject.model;

public class ShelfCapacitySummaryDTO {
    private Integer currentFreeSpaces;
    private Integer maxCapacity;

    public ShelfCapacitySummaryDTO(Integer currentFreeSpaces, Integer maxCapacity) {
        this.currentFreeSpaces = currentFreeSpaces;
        this.maxCapacity = maxCapacity;
    }

    // Getterek és setterek
    public Integer getCurrentFreeSpaces() {
        return currentFreeSpaces;
    }

    public void setCurrentFreeSpaces(Integer currentFreeSpaces) {
        this.currentFreeSpaces = currentFreeSpaces;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }
}