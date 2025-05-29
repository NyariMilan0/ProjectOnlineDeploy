package com.helixlab.raktarproject.controller;

import com.helixlab.raktarproject.model.PalletShelfDTO;
import com.helixlab.raktarproject.model.ShelfCapacitySummaryDTO;
import com.helixlab.raktarproject.model.Shelfs;
import com.helixlab.raktarproject.service.ShelfService;
import java.util.ArrayList;
import java.util.List;
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

@Path("shelfs")
public class ShelfController {

    @Context
    private UriInfo context;
    private ShelfService layer = new ShelfService();

    public ShelfController() {

    }

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
    @Path("getCapacityByShelfUsage")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCapacityByShelfUsage() {
        JSONObject responseObj = new JSONObject();

        try {
            ShelfCapacitySummaryDTO summary = layer.getCapacityByShelfUsage();

            if (summary != null) {
                JSONObject shelfUsageJson = new JSONObject();
                shelfUsageJson.put("currentFreeSpaces", summary.getCurrentFreeSpaces());
                shelfUsageJson.put("maxCapacity", summary.getMaxCapacity());

                responseObj.put("statusCode", 200);
                responseObj.put("shelfUsageSummary", shelfUsageJson);
            } else {
                responseObj.put("statusCode", 404);
                responseObj.put("message", "No data found");
            }

            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();

        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to retrieve shelf capacity summary");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @GET
    @Path("getShelfsById")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getShelfsById(@QueryParam("id") Integer id) {
        Shelfs response = layer.getShelfsById(id);
        JSONObject shelfJson = new JSONObject();

        shelfJson.put("id", response.getId());
        shelfJson.put("name", response.getName());
        shelfJson.put("locationInStorage", response.getLocationInStorage());
        shelfJson.put("maxCapacity", response.getMaxCapacity());
        shelfJson.put("currentCapacity", response.getCurrentCapacity());
        shelfJson.put("height", response.getHeight());
        shelfJson.put("length", response.getLength());
        shelfJson.put("width", response.getWidth());
        shelfJson.put("levels", response.getLevels());
        shelfJson.put("isFull", response.getIsFull());

        return Response.status(Response.Status.OK).entity(shelfJson.toString()).type(MediaType.APPLICATION_JSON).build();

    }

    @DELETE
    @Path("deleteShelfFromStorage")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response deleteShelfFromStorage(@QueryParam("id") Integer id) {
        JSONObject responseObj = new JSONObject();

        try {
            if (id == null || id <= 0) {
                responseObj.put("statusCode", 400);
                responseObj.put("message", "Invalid or missing shelf ID");
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(responseObj.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

            Boolean result = layer.deleteShelfFromStorage(id);

            if (!result) {
                responseObj.put("statusCode", 404);
                responseObj.put("message", "Shelf with ID " + id + " not found or could not be deleted");
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(responseObj.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

            responseObj.put("statusCode", 200);
            responseObj.put("message", "Shelf successfully deleted");
            responseObj.put("result", "success");

            return Response.status(Response.Status.OK)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to delete shelf");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }


    @POST
    @Path("addShelfToStorage")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addShelfToStorage(String jsonInput) {
        JSONObject responseObj = new JSONObject();

        try {
            // Bemeneti JSON feldolgozása
            JSONObject input = new JSONObject(jsonInput);
            Integer storageId = input.getInt("storageId");
            String shelfName = input.getString("shelfName");
            String locationIn = input.getString("locationIn");

            // Service réteg meghívása
            layer.addShelfToStorage(shelfName, locationIn, storageId);

            // Sikeres válasz
            responseObj.put("statusCode", 201); // Created
            responseObj.put("message", "Shelf successfully added to storage");
            responseObj.put("storageId", storageId);
            responseObj.put("shelfName", shelfName);

            return Response.status(Response.Status.CREATED)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (Exception e) {
            // Hiba esetén válasz
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to add shelf to storage");
            responseObj.put("error", e.getMessage());

            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @GET
    @Path("getPalletsWithShelfs")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPalletsAndShelfs() {
        JSONObject responseObj = new JSONObject();

        try {
            List<PalletShelfDTO> palletShelfList = layer.getPalletsWithShelfs();

            if (palletShelfList != null && !palletShelfList.isEmpty()) {
                JSONArray palletShelfArray = new JSONArray();
                for (PalletShelfDTO dto : palletShelfList) {
                    JSONObject palletShelfJson = new JSONObject();
                    palletShelfJson.put("palletId", dto.getPalletId());
                    palletShelfJson.put("palletName", dto.getPalletName());
                    palletShelfJson.put("shelfId", dto.getShelfId());
                    palletShelfJson.put("shelfName", dto.getShelfName());
                    palletShelfJson.put("shelfLocation", dto.getShelfLocation());
                    palletShelfArray.put(palletShelfJson);
                }

                responseObj.put("statusCode", 200);
                responseObj.put("palletsAndShelfs", palletShelfArray);
            } else {
                responseObj.put("statusCode", 404);
                responseObj.put("message", "No pallets and shelfs found");
            }

            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();

        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to retrieve pallets and shelfs");
            responseObj.put("error", e.getMessage());

            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @GET
    @Path("getAllShelfs")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllShelfs() {
        JSONObject responseObj = new JSONObject();

        try {
            ArrayList<Shelfs> shelfList = layer.getAllShelfs();

            JSONArray shelfsArray = new JSONArray();

            for (Shelfs s : shelfList) {
                JSONObject shelfJson = new JSONObject();
                shelfJson.put("id", s.getId());
                shelfJson.put("name", s.getName());
                shelfJson.put("locationInStorage", s.getLocationInStorage());
                shelfJson.put("maxCapacity", s.getMaxCapacity());
                shelfJson.put("currentCapacity", s.getCurrentCapacity());
                shelfJson.put("height", s.getHeight());
                shelfJson.put("length", s.getLength());
                shelfJson.put("width", s.getWidth());
                shelfJson.put("levels", s.getLevels());
                shelfJson.put("isFull", s.getIsFull());

                shelfsArray.put(shelfJson);

            }

            responseObj.put("statusCode", 200);
            responseObj.put("shelfs", shelfsArray);

            // Return the response with a 200 OK status
            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();

        } catch (Exception e) {
            // Handle any exceptions
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to retrieve shelfs");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseObj.toString()).type(MediaType.APPLICATION_JSON).build();
        }

    }

    @GET
    @Path("getShelfsByStorageId")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getShelfsByStorageId(@QueryParam("storageId") Integer storageId) {
        JSONObject responseObj = new JSONObject();

        try {
            if (storageId == null || storageId <= 0) {
                responseObj.put("statusCode", 400);
                responseObj.put("message", "Invalid or missing storageId parameter");
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(responseObj.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

            List<Shelfs> shelfList = layer.getShelfsByStorageId(storageId);

            JSONArray shelfsArray = new JSONArray();
            for (Shelfs shelf : shelfList) {
                JSONObject shelfJson = new JSONObject();
                shelfJson.put("shelfId", shelf.getId());
                shelfJson.put("shelfName", shelf.getName());
                shelfJson.put("shelfLocation", shelf.getLocationInStorage());
                shelfJson.put("shelfMaxCapacity", shelf.getMaxCapacity());
                shelfJson.put("shelfIsFull", shelf.getIsFull());
                shelfsArray.put(shelfJson);
            }

            responseObj.put("statusCode", 200);
            responseObj.put("shelves", shelfsArray);
            responseObj.put("totalShelves", shelfsArray.length());

            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();

        } catch (Exception e) {
            // Handle errors
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to retrieve shelves for storage");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

}
