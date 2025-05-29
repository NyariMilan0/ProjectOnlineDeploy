package com.helixlab.raktarproject.controller;

import com.fasterxml.jackson.databind.util.JSONPObject;
import com.helixlab.raktarproject.model.Users;
import com.helixlab.raktarproject.service.UserService;
import java.util.ArrayList;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import org.json.JSONArray;
import org.json.JSONObject;

@Path("user")
public class UserController {

    @Context
    private UriInfo context;
    private UserService layer = new UserService();

    public UserController() {

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

    @POST
    @Path("login")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response login(String bodyString) {
        JSONObject body = new JSONObject(bodyString);

        JSONObject obj = layer.login(body.getString("userName"), body.getString("password"));
        return Response.status(obj.getInt("statusCode")).entity(obj.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @POST
    @Path("registerUser")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response registerUser(String bodyString) {
        JSONObject body = new JSONObject(bodyString);

        Users u = new Users(
                body.getString("email"),
                body.getString("firstName"),
                body.getString("lastName"),
                body.getString("userName"),
                body.getString("picture"),
                body.getString("password")
        );

        JSONObject obj = layer.registerUser(u);
        return Response.status(obj.getInt("statusCode")).entity(obj.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @POST
    @Path("registerAdmin")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response registerAdmin(String bodyString) {
        JSONObject body = new JSONObject(bodyString);

        Users u = new Users(
                body.getString("email"),
                body.getString("firstName"),
                body.getString("lastName"),
                body.getString("userName"),
                body.getString("picture"),
                body.getString("password")
        );

        JSONObject obj = layer.registerAdmin(u);
        return Response.status(obj.getInt("statusCode")).entity(obj.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("getAllUsers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllUsers() {
        JSONObject responseObj = new JSONObject();

        try {
            // Call the service to get the list of users
            ArrayList<Users> userList = layer.getAllUsers();  // Assuming layer.getAllUsers() returns an ArrayList<User>

            // Initialize a JSON array to store user data
            JSONArray usersArray = new JSONArray();

            // Iterate over the user list and convert each user to a JSONObject
            for (Users u : userList) {
                JSONObject userJson = new JSONObject();
                userJson.put("id", u.getId());
                userJson.put("email", u.getEmail());
                userJson.put("firstName", u.getFirstName());
                userJson.put("lastName", u.getLastName());
                userJson.put("password", u.getPassword());
                userJson.put("isAdmin", u.getIsAdmin());  // Method to get boolean field isAdmin
                userJson.put("userName", u.getUserName());  // Method to get boolean field isAdmin
                userJson.put("isDeleted", u.getIsDeleted());  // Method to get boolean field isDeleted
                userJson.put("createdAt", u.getCreatedAt());
                userJson.put("deletedAt", u.getDeletedAt());
                userJson.put("picture", u.getPicture());

                // Add the user JSON object to the array
                usersArray.put(userJson);
            }

            // Add the users array to the response object
            responseObj.put("statusCode", 200);
            responseObj.put("users", usersArray);

            // Return the response with a 200 OK status
            return Response.ok(responseObj.toString(), MediaType.APPLICATION_JSON).build();

        } catch (Exception e) {
            // Handle any exceptions
            responseObj.put("statusCode", 500);
            responseObj.put("message", "Failed to retrieve users");
            responseObj.put("error", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(responseObj.toString()).type(MediaType.APPLICATION_JSON).build();
        }
    }

    @GET
    @Path("getUserById")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getUserById(@QueryParam("id") Integer id) {
        Users response = layer.getUserById(id);
        JSONObject userJson = new JSONObject();

        userJson.put("id", response.getId());
        userJson.put("email", response.getEmail());
        userJson.put("firstName", response.getFirstName());
        userJson.put("lastName", response.getLastName());
        userJson.put("password", response.getPassword());
        userJson.put("isAdmin", response.getIsAdmin());
        userJson.put("userName", response.getUserName());
        userJson.put("isDeleted", response.getIsDeleted());
        userJson.put("createdAt", response.getCreatedAt());
        userJson.put("deletedAt", response.getDeletedAt());
        userJson.put("picture", response.getPicture());

        return Response.status(Response.Status.OK).entity(userJson.toString()).type(MediaType.APPLICATION_JSON).build();

    }

    @DELETE
    @Path("deleteUser")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response deleteUser(@QueryParam("id") Integer id) {
        Boolean response = layer.deleteUser(id);
        JSONObject toReturn = new JSONObject();

        if (response) {
            toReturn.put("result", "success");
            return Response.status(Response.Status.OK)
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } else {
            toReturn.put("result", "fail");
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @PUT
    @Path("passwordChangeByUserId")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response passwordChangeByUserId(String bodyString) {
        JSONObject body = new JSONObject(bodyString);

        Integer userId = body.getInt("userId");
        String oldPassword = body.getString("oldPassword");
        String newPassword = body.getString("newPassword");

        JSONObject obj = layer.passwordChangeByUserId(userId, oldPassword, newPassword);
        return Response.status(obj.getInt("statusCode")).entity(obj.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @PUT
    @Path("usernameChangeByUserId")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response usernameChangeByUserId(String bodyString) {
        JSONObject body = new JSONObject(bodyString);

        Integer userId = body.getInt("userId");
        String newUsername = body.getString("newUsername");

        JSONObject obj = layer.usernameChangeByUserId(userId, newUsername);
        return Response.status(obj.getInt("statusCode")).entity(obj.toString()).type(MediaType.APPLICATION_JSON).build();
    }

}
