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

public class PalletControllerJUnitTests {

    private static Client client;
    private static final String BASE_URI = "http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/pallet";

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

    // CREATE: POST /pallet/addPalletToShelf
    @Test
    public void testAddPalletToShelf_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("skuCode", "FAKESKU")
                .put("shelfId", 1)
                .put("height", 80);

        Response response = client.target(BASE_URI)
                .path("addPalletToShelf")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(201, response.getStatus(), "A státusznak 201-nek kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(201, responseBody.getInt("statusCode"), "A státuszkódnak 201-nek kell lennie");
        assertEquals("Pallet successfully added to shelf", responseBody.getString("message"), "A válaszüzenet helyes kell legyen");
        assertEquals("FAKESKU", responseBody.getString("skuCode"), "A SKU kód helyes kell legyen");

        response.close();
    }

    // READ: GET /pallet/getPalletsById
    @Test
    public void testGetPalletsById_withValidId_returnsPallet() {
        Response response = client.target(BASE_URI)
                .path("getPalletsById")
                .queryParam("id", 1)
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertTrue(responseBody.has("id"), "A válaszban szerepelnie kell az 'id' mezőnek");
        assertEquals(1, responseBody.getInt("id"), "A raklap ID-jának meg kell egyeznie");

        response.close();
    }

    // UPDATE: POST /pallet/movePalletBetweenShelfs
    @Test
    public void testMovePalletBetweenShelfs_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("palletId", 1)
                .put("fromShelfId", 1)
                .put("toShelfId", 200)
                .put("userId", 40);

        Response response = client.target(BASE_URI)
                .path("movePalletBetweenShelfs")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertEquals("Pallet successfully moved between shelves", responseBody.getString("message"), "A válaszüzenet helyes kell legyen");
        assertEquals(1, responseBody.getInt("palletId"), "A raklap ID-jának meg kell egyeznie");

        response.close();
    }

    // DELETE: DELETE /pallet/deletePalletById
    @Test
    public void testDeletePalletById_withValidId_returnsSuccess() {
        Response response = client.target(BASE_URI)
                .path("deletePalletById")
                .queryParam("id", 1000)
                .request(MediaType.APPLICATION_JSON)
                .delete();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals("success", responseBody.getString("result"), "A válasznak 'success'-nek kell lennie");

        response.close();
    }
}