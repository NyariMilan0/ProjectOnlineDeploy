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

public class UserControllerJUnitTests {

    private static Client client;
    private static final String BASE_URI = "http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/user";

    @BeforeAll
    public static void setUp() {
        // Inicializáljuk a JAX-RS klienst
        client = ClientBuilder.newClient();
    }

    @AfterAll
    public static void tearDown() {
        // Zárjuk a klienst
        client.close();
    }

    @Test
    void testSample() {
        assertTrue(true);
    }

    // CREATE: POST /user/registerUser
    @Test
    public void testRegisterUser_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("email", "teszt.elek@example.com")
                .put("firstName", "Teszt")
                .put("lastName", "Elek")
                .put("userName", "tesztelek")
                .put("picture", "base64image")
                .put("password", "Test123!@#");

        Response response = client.target(BASE_URI)
                .path("registerUser")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals("success", responseBody.getString("status"), "A státusz 'success' kell legyen");
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");

        response.close();
    }

    // CREATE: POST /user/registerAdmin
    @Test
    public void testRegisterAdmin_withValidData_returnsSuccess() {
        JSONObject requestBody = new JSONObject()
                .put("email", "admin@example.com")
                .put("firstName", "Admin")
                .put("lastName", "Főnök")
                .put("userName", "adminfo")
                .put("picture", "base64image")
                .put("password", "Admin123!@#");

        Response response = client.target(BASE_URI)
                .path("registerAdmin")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(requestBody.toString()));

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals("success", responseBody.getString("status"), "A státusz 'success' kell legyen");
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");

        response.close();
    }

    // READ: GET /user/getAllUsers
    @Test
    public void testGetAllUsers_withExistingUsers_returnsUserList() {
        Response response = client.target(BASE_URI)
                .path("getAllUsers")
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertTrue(responseBody.has("users"), "A válaszban szerepelnie kell a 'users' tömbnek");
        assertTrue(responseBody.getJSONArray("users").length() > 0, "A felhasználók listája nem üres");

        response.close();
    }

    // READ: GET /user/getUserById
    @Test
    public void testGetUserById_withValidId_returnsUser() {

        Response response = client.target(BASE_URI)
                .path("getUserById")
                .queryParam("id", 1)
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertTrue(responseBody.has("id"), "A válaszban szerepelnie kell az 'id' mezőnek");
        assertEquals("user1@example.com", responseBody.getString("email"), "Az emailnek meg kell egyeznie");

        response.close();
    }
    
    @Test
    public void testGetUserById_withouthValidId() {

        Response response = client.target(BASE_URI)
                .path("getUserById")
                .queryParam("id", 9999)
                .request(MediaType.APPLICATION_JSON)
                .get();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertTrue(responseBody.has("id"), "A válaszban szerepelnie kell az 'id' mezőnek");
        assertEquals("user9999@example.com", responseBody.getString("email"), "Az emailnek meg kell egyeznie");

        response.close();
    }

    // UPDATE: PUT /user/passwordChangeByUserId
    @Test
    public void testPasswordChangeByUserId_withValidData_returnsSuccess() {

        // Jelszó módosítása
        JSONObject requestBody = new JSONObject()
                .put("userId", 2)
                .put("oldPassword", "Rosszpassword123")
                .put("newPassword", "New123!@#");

        Response response = client.target(BASE_URI)
                .path("passwordChangeByUserId")
                .request(MediaType.APPLICATION_JSON)
                .put(Entity.json(requestBody.toString()));

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals("success", responseBody.getString("status"), "A státusz 'success' kell legyen");
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");

        response.close();
    }

    // UPDATE: PUT /user/usernameChangeByUserId
    @Test
    public void testUsernameChangeByUserId_withValidData_returnsSuccess() {

        // Felhasználónév módosítása
        JSONObject requestBody = new JSONObject()
                .put("userId", 1000)
                .put("newUsername", "ujteszt");

        Response response = client.target(BASE_URI)
                .path("usernameChangeByUserId")
                .request(MediaType.APPLICATION_JSON)
                .put(Entity.json(requestBody.toString()));

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals("success", responseBody.getString("status"), "A státusz 'success' kell legyen");
        assertEquals(200, responseBody.getInt("statusCode"), "A státuszkódnak 200-nak kell lennie");
        assertEquals("ujteszt", responseBody.getJSONObject("result").getString("userName"), "A felhasználónévnek meg kell változnia");

        response.close();
    }

    // DELETE: DELETE /user/deleteUser
    @Test
    public void testDeleteUser_withValidId_returnsSuccess() {

        // Felhasználó törlése
        Response response = client.target(BASE_URI)
                .path("deleteUser")
                .queryParam("id", 4)
                .request(MediaType.APPLICATION_JSON)
                .delete();

        assertEquals(200, response.getStatus(), "A státusznak 200-nak kell lennie");

        JSONObject responseBody = new JSONObject(response.readEntity(String.class));
        assertEquals("success", responseBody.getString("result"), "A válasz 'success' kell legyen");

        response.close();
    }
}
