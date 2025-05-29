/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package loginTest;

import com.helixlab.raktarproject.tests.TestBasePage;
import java.time.Duration;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

/**
 *
 * @author nidid
 */
public class FirstLoginTest {

    WebDriver driver;

    @BeforeClass
    public void setUp() {
        System.setProperty("webdriver.chrome.driver", "C:\\chromedriver\\chromedriver.exe");
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.get("http://localhost:4200/login");
    }

    @AfterClass
    public void tearDown() {
        driver.quit();
    }

    @Test
    public void testLogIn() throws InterruptedException {
        Thread.sleep(2000);
        WebElement username = driver.findElement(By.className("login-input"));
        username.sendKeys("asd");

        WebElement password = driver.findElement(By.className("password-input"));
        password.sendKeys("asd");

        driver.findElement(By.className("signIn")).click();
        Thread.sleep(2000);
        String actualResult = driver.findElement(By.tagName("p")).getText();
        String expectedResult = "MAIN";
        Assert.assertEquals(actualResult, expectedResult);
    }

//    @Test
//    public void testFailedLogIn() throws InterruptedException {
//        Thread.sleep(2000);
//        WebElement username = driver.findElement(By.className("login-input"));
//        username.sendKeys("badlogin");
//
//        WebElement password = driver.findElement(By.className("password-input"));
//        password.sendKeys("badlogin");
//
//        driver.findElement(By.className("signIn")).click();
//        Thread.sleep(2000);
//        String actualResult = driver.findElement(By.tagName("p")).getText();
//        String expectedResult = "MAIN";
//        Assert.assertNotEquals(actualResult, expectedResult);
//    }

    @Test
    public void testFailedLogIn() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        WebElement username = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("login-input")));
        username.sendKeys("badlogin");

        WebElement password = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("password-input")));
        password.sendKeys("badlogin");

        WebElement signInButton = wait.until(ExpectedConditions.elementToBeClickable(By.className("signIn")));
        signInButton.click();

        WebElement resultElement = wait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("p")));
        String actualResult = resultElement.getText();
        String expectedResult = "MAIN";
        Assert.assertNotEquals(actualResult, expectedResult, "A főoldal nem szabadna megjelenjen");
    }
}
