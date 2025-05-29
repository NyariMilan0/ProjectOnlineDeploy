/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.helixlab.raktarproject.service;

import com.helixlab.raktarproject.model.Inventorymovement;
import java.util.ArrayList;

/**
 *
 * @author nidid
 */
public class InventorymovementService {
    
    private Inventorymovement layer = new Inventorymovement();
    
     public ArrayList<Inventorymovement> getInventoryMovement(){
         ArrayList<Inventorymovement> inventorymovementList = new ArrayList<>();
         try {
             inventorymovementList = layer.getInventoryMovement();
         } catch (Exception e) {
         System.err.println("Error fetching Inventorymovements: " + e.getMessage());
        }
        return inventorymovementList;
     }
    
}
