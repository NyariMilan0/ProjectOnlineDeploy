/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package JUnitTests;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import static org.junit.jupiter.api.Assertions.*;

public class MovementRequestControllerJUnitTests {

    private static Client client;
    private static final String BASE_URI = "http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/movementrequests";

    @BeforeAll
    public static void setUp() {
        client = ClientBuilder.newClient();
    }

    @AfterAll
    public static void tearDown() {
        if (client != null) {
            client.close();
        }
    }

    @Test
    public void testGetMovementRequests_withExistingRequests_returnsRequestList() {
        Response response = client.target(BASE_URI)
                .path("getMovementRequests")
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertTrue(responseBody.has("MovementRequests"), "A válaszban szerepelnie kell a 'MovementRequests' tömbnek");
        assertTrue(responseBody.getJSONArray("MovementRequests").length() > 0, "A kérések listája nem üres");

        response.close();
    }

    @Test
    public void testCreateAddMovementRequest_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("adminId", 1100)
                .put("palletId", 1000)
                .put("toShelfId", 400)
                .put("timeLimit", "2025-04-20 12:00:00");

        Response response = client.target(BASE_URI)
                .path("createAddMovementRequest")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertEquals("Add movement request created successfully", responseBody.getString("message"), "A válaszüzenet helyes kell legyen");

        response.close();
    }

    @Test
    public void testCreateMoveMovementRequest_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("adminId", 110000)
                .put("palletId", 6)
                .put("fromShelfId", 2)
                .put("toShelfId", 8)
                .put("timeLimit", "2025-04-20 12:00:00");

        Response response = client.target(BASE_URI)
                .path("createMoveMovementRequest")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertEquals("Move movement request created successfully", responseBody.getString("message"), "A válaszüzenet helyes kell legyen");
        assertEquals(11000, responseBody.getInt("adminId"), "Az adminId helyes kell legyen");
        assertEquals(6, responseBody.getInt("palletId"), "A palletId helyes kell legyen");
        assertEquals(2, responseBody.getInt("fromShelfId"), "A fromShelfId helyes kell legyen");
        assertEquals(8, responseBody.getInt("toShelfId"), "A toShelfId helyes kell legyen");

        response.close();
    }

    @Test
    public void testCreateRemoveMovementRequest_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("adminId", 11000)
                .put("palletId", 5)
                .put("fromShelfId", 2)
                .put("timeLimit", "2025-04-20 12:00:00");

        Response response = client.target(BASE_URI)
                .path("createRemoveMovementRequest")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertEquals("Remove movement request created successfully", responseBody.getString("message"), "A válaszüzenet helyes kell legyen");

        response.close();
    }

    @Test
    public void testCompleteMovementRequest_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("movementRequestId", 6)
                .put("userId", 12000);

        Response response = client.target(BASE_URI)
                .path("completeMovementRequest")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertTrue(responseBody.getString("message").contains("successfully completed"), "A válaszüzenet helyes kell legyen");
        assertEquals(6, responseBody.getInt("movementRequestId"), "A movementRequestId helyes kell legyen");
        assertEquals(12000, responseBody.getInt("userId"), "A userId helyes kell legyen");

        response.close();
    }
}
