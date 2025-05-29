package com.helixlab.raktarproject.service;

import com.helixlab.raktarproject.model.Storage;
import java.util.ArrayList;
import org.json.JSONObject;

public class StorageService {

    private Storage layer = new Storage();

    public void addStorage(String storageName, String location) {
        try {
            Storage.addStorage(storageName, location);
        } catch (Exception e) {
            throw new RuntimeException("Service layer error: " + e.getMessage(), e);
        }
    }

    public ArrayList<Storage> getAllStorages() {
        ArrayList<Storage> storageList = new ArrayList<>();
        try {
            storageList = layer.getAllStorages();
        } catch (Exception e) {
            System.err.println("Error fetching storages: " + e.getMessage());
        }

        return storageList;
    }

    public Boolean deleteStorageById(Integer storageId) {
        try {
            Boolean isDeleted = Storage.deleteStorageById(storageId);
            if (!isDeleted) {
                System.err.println("Storage could not be deleted: No storage found or it has associated shelves.");
            }
            return isDeleted;
        } catch (Exception e) {
            System.err.println("Service layer error while deleting storage: " + e.getMessage());
            return false;
        }
    }

}
