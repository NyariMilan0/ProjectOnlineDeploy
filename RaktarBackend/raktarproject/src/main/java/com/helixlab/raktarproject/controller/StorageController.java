/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.helixlab.raktarproject.controller;

import com.helixlab.raktarproject.model.Storage;
import com.helixlab.raktarproject.service.StorageService;
import java.util.ArrayList;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import org.json.JSONArray;
import org.json.JSONObject;

@Path("storage")
public class StorageController {

    @Context
    private UriInfo context;
    private StorageService layer = new StorageService();

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

    @POST
    @Path("addStorage")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addStorage(String jsonInput) {
        JSONObject responseObj = new JSONObject();

        try {
            JSONObject input = new JSONObject(jsonInput);
            String storageName = input.getString("storageName");
            String location = input.getString("location");

            layer.addStorage(storageName, location);

            responseObj.put("statusCode", 201); // Created
            responseObj.put("message", "Storage successfully added");
            responseObj.put("storageName", storageName);
            responseObj.put("location", location);

            return Response.status(Response.Status.CREATED)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to add storage");
            responseObj.put("error", e.getMessage());

            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @GET
    @Path("getAllStorages")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllStorages() {
        JSONObject responseObj = new JSONObject();

        try {
            ArrayList<Storage> storageList = layer.getAllStorages();

            JSONArray storageArray = new JSONArray();

            for (Storage s : storageList) {
                JSONObject storageJson = new JSONObject();
                storageJson.put("id", s.getId());
                storageJson.put("name", s.getName());
                storageJson.put("location", s.getLocation());
                storageJson.put("maxCapacity", s.getMaxCapacity());
                storageJson.put("currentCapacity", s.getCurrentCapacity());
                storageJson.put("isFull", s.getIsFull());

                storageArray.put(storageJson);

            }

            responseObj.put("statusCode", 200);
            responseObj.put("Storages", storageArray);

            // Return the response with a 200 OK status
            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();

        } catch (Exception e) {
            // Handle any exceptions
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to retrieve storages");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseObj.toString()).type(MediaType.APPLICATION_JSON).build();
        }

    }

    @DELETE
    @Path("deleteStorageById")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteStorageById(@QueryParam("id") Integer storageId) {
        JSONObject responseObj = new JSONObject();

        try {
            Boolean isDeleted = layer.deleteStorageById(storageId);

            if (isDeleted) {
                responseObj.put("statusCode", 200);
                responseObj.put("message", "Storage successfully deleted");
                responseObj.put("storageId", storageId);
                return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();
            } else {
                responseObj.put("statusCode", 400); // Bad Request, mert a feltétel nem teljesült
                responseObj.put("message", "Storage could not be deleted: It may have associated shelves or does not exist");
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(responseObj.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }
        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to delete storage");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
