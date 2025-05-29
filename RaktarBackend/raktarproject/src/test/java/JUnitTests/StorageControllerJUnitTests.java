package JUnitTests;

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

public class StorageControllerJUnitTests {

    private static Client client;
    private static final String BASE_URI = "http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/storage";

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

    // CREATE: POST /storage/addStorage
    @Test
    public void testAddStorage_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("storageName", "")
                .put("location", "");

        Response response = client.target(BASE_URI)
                .path("addStorage")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(201, response.getStatus(), "A státusznak 201-nek kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertEquals("Storage successfully added", responseBody.getString("message"), "A válaszüzenet helyes kell legyen");
        assertEquals("TestStorage", responseBody.getString("storageName"), "A tároló neve helyes kell legyen");

        response.close();
    }

    // READ: GET /storage/getAllStorages
    @Test
    public void testGetAllStorages_withExistingStorages_returnsStorageList() {
        Response response = client.target(BASE_URI)
                .path("getAllStorages")
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertTrue(responseBody.has("Storages"), "A válaszban szerepelnie kell a 'Storages' tömbnek");
        assertTrue(responseBody.getJSONArray("Storages").length() > 0, "A tárolók listája nem üres");

        response.close();
    }

    // DELETE: DELETE /storage/deleteStorageById
    @Test
    public void testDeleteStorageById_withValidId_returnsSuccess() {
        // Feltételezzük, hogy létezik egy tároló ID-val 1
        Response response = client.target(BASE_URI)
                .path("deleteStorageById")
                .queryParam("id", 9999)
                .request(MediaType.APPLICATION_JSON)
                .delete();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertEquals("Storage successfully deleted", responseBody.getString("message"), "A válaszüzenet helyes kell legyen");

        response.close();
    }
}