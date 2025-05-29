/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.helixlab.raktarproject.service;

import com.helixlab.raktarproject.model.PalletShelfDTO;
import com.helixlab.raktarproject.model.ShelfCapacitySummaryDTO;
import com.helixlab.raktarproject.model.Shelfs;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author nidid
 */
public class ShelfService {

    private Shelfs layer = new Shelfs();

    public ShelfCapacitySummaryDTO getCapacityByShelfUsage() {
        ShelfCapacitySummaryDTO summary = null;

        try {
            summary = Shelfs.getCapacityByShelfUsage();
        } catch (Exception e) {
            System.err.println("Error fetching shelf capacity summary: " + e.getMessage());
        }

        return summary;
    }

    public Shelfs getShelfsById(Integer id) {
        return layer.getShelfsById(id);
    }

    public Boolean deleteShelfFromStorage(Integer id) {
        // Validate if shelf exists
        Shelfs shelf = getShelfsById(id);
        if (shelf == null) {
            System.err.println("Cannot delete: Shelf with ID " + id + " does not exist");
            return false;
        }

        // Attempt to delete the shelf
        Boolean deletionResult = layer.deleteShelfFromStorage(id);
        if (!deletionResult) {
            System.err.println("Failed to delete shelf with ID " + id + ": Deletion operation returned false");
            return false;
        }

        return true;
    }

    public void addShelfToStorage(String shelfName, String locationIn, Integer storageId) {
        try {
            Shelfs.addShelfToStorage(shelfName, locationIn, storageId);
        } catch (Exception e) {
            throw new RuntimeException("Service layer error: " + e.getMessage(), e);
        }
    }

    public List<PalletShelfDTO> getPalletsWithShelfs() {
        List<PalletShelfDTO> result = null;

        try {
            result = Shelfs.getPalletsWithShelfs();
            if (result == null || result.isEmpty()) {
                throw new RuntimeException("No pallets and shelfs found");
            }
        } catch (Exception e) {
            System.err.println("Error fetching pallets and shelfs: " + e.getMessage());
            throw new RuntimeException("Service layer error: " + e.getMessage(), e);
        }

        return result;
    }

    public ArrayList<Shelfs> getAllShelfs() {
        ArrayList<Shelfs> shelfList = new ArrayList<>();
        try {
            shelfList = layer.getAllShelfs();
        } catch (Exception e) {
            System.err.println("Error fetching shelfs: " + e.getMessage());
        }

        return shelfList;
    }

    public ArrayList<Shelfs> getShelfsByStorageId(Integer storageId) {
        ArrayList<Shelfs> shelfList = new ArrayList<>();
        try {
            shelfList = layer.getShelfsByStorageId(storageId);
        } catch (Exception e) {
            System.err.println("Error fetching shelves by storage ID: " + e.getMessage());
        }
        return shelfList;
    }

}
