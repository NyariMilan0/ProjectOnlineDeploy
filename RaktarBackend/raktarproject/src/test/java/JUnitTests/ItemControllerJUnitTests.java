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

public class ItemControllerJUnitTests {

    private static Client client;
    private static final String BASE_URI = "http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/items";

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

    // CREATE: POST /items/addItem
    @Test
    public void testAddItem_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("sku", "TESTSKU123")
                .put("type", "BADTYPE")
                .put("name", "Test Item")
                .put("amount", 10)
                .put("price", 99.99)
                .put("weight", 5.5)
                .put("size", 1.0)
                .put("description", "Test description");

        Response response = client.target(BASE_URI)
                .path("addItem")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(201, response.getStatus(), "A státusznak 201-nek kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(201, responseBody.getInt("statusCode"), "A státuszkódnak 201-nek kell lennie");
        assertEquals("Item successfully added", responseBody.getString("message"), "A válaszüzenet helyes kell legyen");
        assertEquals("TESTSKU123", responseBody.getString("sku"), "A SKU kód helyes kell legyen");

        response.close();
    }

    // READ: GET /items/getItemList
    @Test
    public void testGetItemList_withExistingItems_returnsItemList() {
        Response response = client.target(BASE_URI)
                .path("getItemList")
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertTrue(responseBody.has("items"), "A válaszban szerepelnie kell az 'items' tömbnek");
        assertTrue(responseBody.getJSONArray("items").length() > 0, "A termékek listája nem üres");

        response.close();
    }
}
