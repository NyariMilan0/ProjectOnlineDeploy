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

public class ShelfControllerJUnitTests {

    private static Client client;
    private static final String BASE_URI = "http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/shelfs";

    @BeforeAll
    public static void setUp() {
        // Inicializáljuk a JAX-RS klienst
        client = ClientBuilder.newClient();
    }

    @AfterAll
    public static void tearDown() {
        // Zárjuk a klienst
        if (client != null) {
            client.close();
        }
    }

    // CREATE: POST /shelfs/addShelfToStorage
    @Test
    public void testAddShelfToStorage_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("storageId", 2)
                .put("shelfName", "TestShelf 2")
                .put("locationIn", "Aisle 2");

        Response response = client.target(BASE_URI)
                .path("addShelfToStorage")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(201, response.getStatus(), "A státusznak 201-nek kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(201, responseBody.getInt("statusCode"), "A státuszkódnak 201-nek kell lennie");
        assertEquals("Shelf successfully added to storage", responseBody.getString("message"), "A válaszüzenet helyes kell legyen");
        assertEquals("TestShelf 2", responseBody.getString("shelfName"), "A polc neve helyes kell legyen");

        response.close();
    }

    // READ: GET /shelfs/getAllShelfs
    @Test
    public void testGetAllShelfs_withExistingShelfs_returnsShelfList() {
        Response response = client.target(BASE_URI)
                .path("getAllShelfs")
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertTrue(responseBody.has("shelfs"), "A válaszban szerepelnie kell a 'shelfs' tömbnek");
        assertTrue(responseBody.getJSONArray("shelfs").length() > 0, "A polcok listája nem üres");

        response.close();
    }

    // READ: GET /shelfs/getShelfsById
    @Test
    public void testGetShelfsById_withValidId_returnsShelf() {
        Response response = client.target(BASE_URI)
                .path("getShelfsById")
                .queryParam("id", 1)
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertTrue(responseBody.has("id"), "A válaszban szerepelnie kell az 'id' mezőnek");
        assertEquals("Shelf a", responseBody.getString("name"), "A polc nevének meg kell egyeznie");

        response.close();
    }

    // READ: GET /shelfs/getShelfsByStorageId
    @Test
    public void testGetShelfsByStorageId_withValidStorageId_returnsShelfs() {
        Response response = client.target(BASE_URI)
                .path("getShelfsByStorageId")
                .queryParam("storageId", 100)
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertTrue(responseBody.has("shelves"), "A válaszban szerepelnie kell a 'shelves' tömbnek");
        assertTrue(responseBody.getJSONArray("shelves").length() > 0, "A polcok listája nem üres");

        JSONArray shelves = responseBody.getJSONArray("shelves");
        JSONObject firstShelf = shelves.getJSONObject(0);
        assertEquals("Shelf B", firstShelf.getString("shelfName"), "A polc nevének meg kell egyeznie");

        response.close();
    }

    // DELETE: DELETE /shelfs/deleteShelfFromStorage
    @Test
    public void testDeleteShelfFromStorage_withValidId_returnsSuccess() {
        Response response = client.target(BASE_URI)
                .path("deleteShelfFromStorage")
                .queryParam("id", 12)
                .request(MediaType.APPLICATION_JSON)
                .delete();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals("success", responseBody.getString("result"), "A válasz 'success' kell legyen");

        response.close();
    }
}
