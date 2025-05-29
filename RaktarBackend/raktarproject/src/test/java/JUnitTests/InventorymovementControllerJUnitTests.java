package JUnitTests;

import org.json.JSONObject;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import static org.junit.jupiter.api.Assertions.*;

public class InventorymovementControllerJUnitTests {

    private static Client client;
    private static final String BASE_URI = "http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/inventorymovement";

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
    public void testGetInventoryMovement_withExistingMovements_returnsMovementList() {
        Response response = client.target(BASE_URI)
                .path("getInventoryMovement")
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertTrue(responseBody.has("Inventorymovements"), "A válaszban szerepelnie kell az 'Inventorymovements' tömbnek");
        assertTrue(responseBody.getJSONArray("Inventorymovements").length() > 0, "A mozgások listája nem üres");

        response.close();
    }
}
