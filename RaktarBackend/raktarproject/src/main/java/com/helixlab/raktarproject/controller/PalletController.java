package com.helixlab.raktarproject.controller;

import com.helixlab.raktarproject.model.Pallets;
import com.helixlab.raktarproject.model.Users;
import com.helixlab.raktarproject.service.PalletService;
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
import org.json.JSONObject;

@Path("pallet")
public class PalletController {

    @Context
    private UriInfo context;
    private PalletService layer = new PalletService();

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
    @Path("getPalletsById")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getPalletsById(@QueryParam("id") Integer id) {
        Pallets response = layer.getPalletsById(id);
        JSONObject palletJson = new JSONObject();

        palletJson.put("id", response.getId());
        palletJson.put("name", response.getName());
        palletJson.put("CreatedAt", response.getCreatedAt());
        palletJson.put("Height", response.getHeight());
        palletJson.put("Length", response.getLength());
        palletJson.put("Width", response.getWidth());

        return Response.status(Response.Status.OK).entity(palletJson.toString()).type(MediaType.APPLICATION_JSON).build();

    }

    @DELETE
    @Path("deletePalletById")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response deletePalletById(@QueryParam("id") Integer id) {
        Boolean response = layer.deletePalletById(id);
        JSONObject toReturn = new JSONObject();

        String result = "";

        if (response == false) {
            result = "fail";
        } else {
            result = "success";
        }

        toReturn.put("result", result);

        return Response.status(Response.Status.OK).entity(toReturn.toString()).type(MediaType.APPLICATION_JSON).build();

    }

    @POST
    @Path("addPalletToShelf")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addPalletToShelf(String jsonInput) {
        JSONObject responseObj = new JSONObject();

        try {
            JSONObject input = new JSONObject(jsonInput);
            String skuCode = input.getString("skuCode");
            Integer shelfId = input.getInt("shelfId");
            Integer height = input.getInt("height");

            layer.addPalletToShelf(skuCode, shelfId, height);

            responseObj.put("statusCode", 201); // Created
            responseObj.put("message", "Pallet successfully added to shelf");
            responseObj.put("skuCode", skuCode);
            responseObj.put("shelfId", shelfId);
            responseObj.put("height", height);

            return Response.status(Response.Status.CREATED)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (IllegalArgumentException e) {
            // Ha a SKU nem létezik, 400 Bad Request-et adunk vissza
            responseObj.put("statusCode", 400);
            responseObj.put("message", "Invalid SKU code: " + e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (Exception e) {
            // Egyéb hibák esetén 500 Internal Server Error
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to add pallet to shelf");
            responseObj.put("error", e.getMessage());

            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("movePalletBetweenShelfs")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response movePalletBetweenShelfs(String jsonInput) {
        JSONObject responseObj = new JSONObject();

        try {
            JSONObject input = new JSONObject(jsonInput);
            Integer palletId = input.getInt("palletId");
            Integer fromShelfId = input.getInt("fromShelfId");
            Integer toShelfId = input.getInt("toShelfId");
            Integer userId = input.getInt("userId");

            layer.movePalletBetweenShelfs(palletId, fromShelfId, toShelfId, userId);

            responseObj.put("statusCode", 200); // OK
            responseObj.put("message", "Pallet successfully moved between shelves");
            responseObj.put("palletId", palletId);
            responseObj.put("fromShelfId", fromShelfId);
            responseObj.put("toShelfId", toShelfId);
            responseObj.put("userId", userId);

            return Response.status(Response.Status.OK)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (IllegalArgumentException e) {
            // Ha a pallet, shelf, vagy user nem létezik, 400 Bad Request-et adunk vissza
            responseObj.put("statusCode", 400);
            responseObj.put("message", "Invalid input: " + e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (Exception e) {
            // Egyéb hibák esetén 500 Internal Server Error
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to move pallet between shelves");
            responseObj.put("error", e.getMessage());

            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

}
