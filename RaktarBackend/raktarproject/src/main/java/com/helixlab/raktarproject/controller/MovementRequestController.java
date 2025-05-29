package com.helixlab.raktarproject.controller;

import com.helixlab.raktarproject.model.MovementRequests;
import com.helixlab.raktarproject.service.MovementRequestService;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import org.json.JSONArray;
import org.json.JSONObject;

@Path("movementrequests")
public class MovementRequestController {

    @Context
    private UriInfo context;
    private MovementRequestService layer = new MovementRequestService();

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
    @Path("getMovementRequests")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getMovementRequests() {
        JSONObject responseObj = new JSONObject();

        try {
            ArrayList<MovementRequests> movementList = layer.getMovementRequests();

            JSONArray movementArray = new JSONArray();

            for (MovementRequests mr : movementList) {
                JSONObject movementJSON = new JSONObject();
                movementJSON.put("id", mr.getId());
                movementJSON.put("adminId", mr.getAdminId());
                movementJSON.put("pallet_id", mr.getPalletId());
                movementJSON.put("fromShelfId", mr.getFromShelfId());
                movementJSON.put("toShelfId", mr.getToShelfId());
                movementJSON.put("actionType", mr.getActionType());
                movementJSON.put("status", mr.getStatus());
                movementJSON.put("timeLimit", mr.getTimeLimit());

                movementArray.put(movementJSON);
            }
            responseObj.put("statusCode", 200);
            responseObj.put("MovementRequests", movementArray);

            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();

        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to retrieve MovementRequests");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseObj.toString()).type(MediaType.APPLICATION_JSON).build();
        }
    }

    @POST
    @Path("createAddMovementRequest")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createAddMovementRequest(String jsonInput) {
        JSONObject responseObj = new JSONObject();
        try {
            JSONObject input = new JSONObject(jsonInput);
            int adminId = input.getInt("adminId");
            int palletId = input.getInt("palletId");
            int toShelfId = input.getInt("toShelfId");
            String timeLimitStr = input.getString("timeLimit");

            // Parse timeLimit from string to Date
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            Date timeLimit = sdf.parse(timeLimitStr);

            layer.createAddMovementRequest(adminId, palletId, toShelfId, timeLimit);

            responseObj.put("statusCode", 200);
            responseObj.put("message", "Add movement request created successfully");
            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();
        } catch (IllegalArgumentException e) {
            responseObj.put("statusCode", 400);
            responseObj.put("message", e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to create add movement request");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("createMoveMovementRequest")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createMoveMovementRequest(String jsonInput) {
        JSONObject responseObj = new JSONObject();
        try {
            // JSON bemenet feldolgozása
            JSONObject input = new JSONObject(jsonInput);

            // Kötelező mezők ellenőrzése
            if (!input.has("adminId") || !input.has("palletId") || !input.has("fromShelfId")
                    || !input.has("toShelfId") || !input.has("timeLimit")) {
                responseObj.put("statusCode", 400);
                responseObj.put("message", "Missing required fields: adminId, palletId, fromShelfId, toShelfId, timeLimit");
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(responseObj.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

            int adminId = input.getInt("adminId");
            int palletId = input.getInt("palletId");
            int fromShelfId = input.getInt("fromShelfId");
            int toShelfId = input.getInt("toShelfId");
            String timeLimitStr = input.getString("timeLimit");

            // timeLimit konvertálása Date objektummá
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            Date timeLimit;
            try {
                timeLimit = sdf.parse(timeLimitStr);
            } catch (ParseException e) {
                responseObj.put("statusCode", 400);
                responseObj.put("message", "Invalid timeLimit format. Expected: yyyy-MM-dd HH:mm:ss");
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(responseObj.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

            // Service réteg hívása
            layer.createMoveMovementRequest(adminId, palletId, fromShelfId, toShelfId, timeLimit);

            // Sikeres válasz
            responseObj.put("statusCode", 200);
            responseObj.put("message", "Move movement request created successfully");
            responseObj.put("adminId", adminId);
            responseObj.put("palletId", palletId);
            responseObj.put("fromShelfId", fromShelfId);
            responseObj.put("toShelfId", toShelfId);
            responseObj.put("timeLimit", timeLimitStr);
            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();

        } catch (IllegalArgumentException e) {
            responseObj.put("statusCode", 400);
            responseObj.put("message", e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (org.json.JSONException e) {
            responseObj.put("statusCode", 400);
            responseObj.put("message", "Invalid JSON input: " + e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to create move movement request");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("createRemoveMovementRequest")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createRemoveMovementRequest(String jsonInput) {
        JSONObject responseObj = new JSONObject();
        try {
            JSONObject input = new JSONObject(jsonInput);
            int adminId = input.getInt("adminId");
            int palletId = input.getInt("palletId");
            int fromShelfId = input.getInt("fromShelfId");
            String timeLimitStr = input.getString("timeLimit");

            // Parse timeLimit from string to Date
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            Date timeLimit = sdf.parse(timeLimitStr);

            layer.createRemoveMovementRequest(adminId, palletId, fromShelfId, timeLimit);

            responseObj.put("statusCode", 200);
            responseObj.put("message", "Remove movement request created successfully");
            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();
        } catch (IllegalArgumentException e) {
            responseObj.put("statusCode", 400);
            responseObj.put("message", e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to create remove movement request");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("completeMovementRequest")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response completeMovementRequest(String jsonInput) {
        JSONObject responseObj = new JSONObject();
        try {
            // JSON bemenet feldolgozása
            JSONObject input = new JSONObject(jsonInput);

            // Kötelező mezők ellenőrzése
            if (!input.has("movementRequestId") || !input.has("userId")) {
                responseObj.put("statusCode", 400);
                responseObj.put("message", "Missing required fields: movementRequestId, userId");
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(responseObj.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

            Integer movementRequestId = input.getInt("movementRequestId");
            Integer userId = input.getInt("userId");

            // Service réteg hívása
            boolean result = layer.completeMovementRequest(movementRequestId, userId);

            // Sikeres válasz
            if (result) {
                responseObj.put("statusCode", 200);
                responseObj.put("message", "Movement request with ID " + movementRequestId + " successfully completed");
                responseObj.put("movementRequestId", movementRequestId);
                responseObj.put("userId", userId);
                return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();
            } else {
                responseObj.put("statusCode", 400);
                responseObj.put("message", "Movement request with ID " + movementRequestId + " could not be completed");
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(responseObj.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

        } catch (IllegalArgumentException e) {
            responseObj.put("statusCode", 400);
            responseObj.put("message", e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (org.json.JSONException e) {
            responseObj.put("statusCode", 400);
            responseObj.put("message", "Invalid JSON input: " + e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (Exception e) {
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to complete movement request");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(responseObj.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
