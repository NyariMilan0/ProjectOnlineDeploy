package com.helixlab.raktarproject.service;

import com.helixlab.raktarproject.model.Items;
import com.helixlab.raktarproject.model.Material;
import java.util.List;

public class ItemService {

    public void addItem(String sku, String type, String name, Integer amount, Double price, Double weight, Double size, String description) {
        try {
            // Konvertáljuk a type stringet Material ENUM-má
            Material material = Material.fromValue(type.toLowerCase());
            
            Items.addItem(sku, material.getValue(), name, amount, price, weight, size, description);
        } catch (Exception e) {
            throw new RuntimeException("Service layer error: " + e.getMessage(), e);
        }
    }
    
    public List<Items> getItemList() {
        List<Items> itemList = null;

        try {
            itemList = Items.getItemList();
            if (itemList == null || itemList.isEmpty()) {
                throw new RuntimeException("No items found");
            }
        } catch (Exception e) {
            throw new RuntimeException("Service layer error: " + e.getMessage(), e);
        }

        return itemList;
    }
}