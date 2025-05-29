package com.helixlab.raktarproject.controller;

import com.helixlab.raktarproject.model.Items;
import com.helixlab.raktarproject.service.ItemService;
import com.helixlab.raktarproject.model.Material;
import java.util.List;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.json.JSONArray;
import org.json.JSONObject;

@Path("items")
public class ItemController {

    private ItemService layer = new ItemService();

    @POST
    @Path("addItem")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addItem(String jsonInput) {
        JSONObject responseObj = new JSONObject();

        try {
            JSONObject input = new JSONObject(jsonInput);
            String sku = input.getString("sku");
            String type = input.getString("type");
            String name = input.getString("name");
            Integer amount = input.getInt("amount");
            Double price = input.getDouble("price");
            Double weight = input.getDouble("weight");
            Double size = input.getDouble("size");
            String description = input.optString("description", ""); // Opcionális, ha nincs megadva, üres string

            layer.addItem(sku, type, name, amount, price, weight, size, description);

            responseObj.put("statusCode", 201); // Created
            responseObj.put("message", "Item successfully added");
            responseObj.put("sku", sku);
            responseObj.put("type", type.toLowerCase());
            responseObj.put("name", name);
            responseObj.put("amount", amount);
            responseObj.put("price", price);
            responseObj.put("weight", weight);
            responseObj.put("size", size);
            responseObj.put("description", description);

            return Response.status(Response.Status.CREATED)
                           .entity(responseObj.toString())
                           .type(MediaType.APPLICATION_JSON)
                           .build();

        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to add item");
            responseObj.put("error", e.getMessage());

            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                           .entity(responseObj.toString())
                           .type(MediaType.APPLICATION_JSON)
                           .build();
        }
    }
    
    @GET
    @Path("getItemList")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getItemList() {
        JSONObject responseObj = new JSONObject();

        try {
            // Service réteg meghívása
            List<Items> itemList = layer.getItemList();

            if (itemList != null && !itemList.isEmpty()) {
                JSONArray itemsArray = new JSONArray();
                for (Items item : itemList) {
                    JSONObject itemJson = new JSONObject();
                    itemJson.put("id", item.getId());
                    itemJson.put("sku", item.getSku());
                    itemJson.put("type", item.getType().getValue()); // ENUM érték stringként
                    itemJson.put("name", item.getName());
                    itemJson.put("amount", item.getAmount());
                    itemJson.put("price", item.getPrice());
                    itemJson.put("weight", item.getWeight());
                    itemJson.put("size", item.getSize());
                    itemJson.put("description", item.getDescription());
                    itemsArray.put(itemJson);
                }

                responseObj.put("statusCode", 200);
                responseObj.put("items", itemsArray);
            } else {
                responseObj.put("statusCode", 404);
                responseObj.put("message", "No items found");
            }

            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();

        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to retrieve item list");
            responseObj.put("error", e.getMessage());

            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                           .entity(responseObj.toString())
                           .type(MediaType.APPLICATION_JSON)
                           .build();
        }
    }
}