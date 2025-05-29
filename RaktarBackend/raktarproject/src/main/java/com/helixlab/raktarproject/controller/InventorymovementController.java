package com.helixlab.raktarproject.controller;

import com.helixlab.raktarproject.model.Inventorymovement;
import com.helixlab.raktarproject.service.InventorymovementService;
import java.util.ArrayList;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import org.json.JSONArray;
import org.json.JSONObject;

@Path("inventorymovement")
public class InventorymovementController {

    @Context
    private UriInfo context;
    private InventorymovementService layer = new InventorymovementService();

    @GET
    @Produces(MediaType.APPLICATION_XML)
    public String getXml() {
        //TODO return proper representation object
        throw new UnsupportedOperationException();
    }

    @PUT
    @Produces(MediaType.APPLICATION_XML)
    public void putXml(String content) {

    }

    @GET
    @Path("getInventoryMovement")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getInventoryMovement() {
        JSONObject responseObj = new JSONObject();

        try {
            ArrayList<Inventorymovement> inventorymovementList = layer.getInventoryMovement();

            JSONArray inventoryArray = new JSONArray();

            for (Inventorymovement im : inventorymovementList) {
                JSONObject inventoryJSON = new JSONObject();
                inventoryJSON.put("id", im.getId());
                inventoryJSON.put("movementDate", im.getMovementDate());
                inventoryJSON.put("actionType", im.getActionType());
                inventoryJSON.put("storageFrom", (im.getStorageFrom() != null ? im.getStorageFrom().getId() : JSONObject.NULL));
                inventoryJSON.put("storageTo", (im.getStorageTo() != null ? im.getStorageTo().getId() : JSONObject.NULL));
                inventoryJSON.put("fromShelf", (im.getFromShelf() != null ? im.getFromShelf().getId() : JSONObject.NULL));
                inventoryJSON.put("toShelf", (im.getToShelf() != null ? im.getToShelf().getId() : JSONObject.NULL));
                inventoryJSON.put("palletSKU", im.getPalletSKU());
                inventoryJSON.put("byUser", (im.getByUser() != null ? im.getByUser().getId() : JSONObject.NULL));

                inventoryArray.put(inventoryJSON);
            }
            responseObj.put("statusCode", 200);
            responseObj.put("Inventorymovements", inventoryArray);

            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();

        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to retrieve Inventorymovements");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseObj.toString()).type(MediaType.APPLICATION_JSON).build();
        }
    }
}
