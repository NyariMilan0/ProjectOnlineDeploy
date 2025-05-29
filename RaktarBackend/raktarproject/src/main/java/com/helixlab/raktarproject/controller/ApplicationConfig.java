package com.helixlab.raktarproject.controller;


import java.util.Set;
import javax.ws.rs.core.Application;

@javax.ws.rs.ApplicationPath("webresources")
public class ApplicationConfig extends Application {

    @Override
    public Set<Class<?>> getClasses() {
        Set<Class<?>> resources = new java.util.HashSet<>();
        addRestResourceClasses(resources);
        return resources;
    }

    /**
     * Do not modify addRestResourceClasses() method.
     * It is automatically populated with
     * all resources defined in the project.
     * If required, comment out calling this method in getClasses().
     */
    private void addRestResourceClasses(Set<Class<?>> resources) {
        resources.add(com.helixlab.raktarproject.controller.CorsFilter.class);
        resources.add(com.helixlab.raktarproject.controller.InventorymovementController.class);
        resources.add(com.helixlab.raktarproject.controller.ItemController.class);
        resources.add(com.helixlab.raktarproject.controller.MovementRequestController.class);
        resources.add(com.helixlab.raktarproject.controller.PalletController.class);
        resources.add(com.helixlab.raktarproject.controller.ShelfController.class);
        resources.add(com.helixlab.raktarproject.controller.StorageController.class);
        resources.add(com.helixlab.raktarproject.controller.UserController.class);
    }

        

}
