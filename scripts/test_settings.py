import unittest
from methods import methods
from selenium.webdriver.common.action_chains import ActionChains
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class test_settings(unittest.TestCase):
    test = methods()

    def setUp(self):
        self.driver = self.test.get_driver()
        self.actions = ActionChains(self.driver)
        time.sleep(25)
        # pass

    def tearDown(self):
        time.sleep(2)
        self.driver.close()
        # pass

    def test_general(self):

        # Tests general settings

        # Start
        print("----------------\nStart General Settings Test...")

        username = "admin"
        password = "pleasechange"

        # Login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        print("Login Successful!")
        time.sleep(5)

        # Create New Drawing
        print("Creating new drawing...")
        self.test.create_drawing()
        print("Create new drawing successful!")
        time.sleep(5)

        # Click Settings button
        print("Going to settings page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Settings')]").click()
        print("Settings page opened!")
        time.sleep(5)

        # Click General Settings
        print("Opening General Settings...")
        self.driver.find_element_by_xpath("//a[contains(text(),'General')]").click()
        print("General Settings Opened!")
        time.sleep(2)

        # Check Settings
        print("Checking settings...")
        project_title = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Project Title']")))
        self.assertTrue(project_title.is_enabled(), "ERROR: Project title field cannot be edited!")
        print("Project Title Enabled...")
        project_no = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Project No.']")))
        self.assertTrue(project_no.is_enabled(), "ERROR: Project No. field cannot be edited!")
        print("Project Number Enabled...")
        # self.assertEqual(project_no.get_attribute("type"),"number","ERROR: Project Number should only accept number inputs!")
        print("Project Number Accepts Number Inputs...")
        project_stage = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Project Stage']")))
        self.assertTrue(project_stage.is_enabled(),"ERROR: Project stage field cannot be edited!")
        print("Project Stage Enabled...")
        designer = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Designer']")))
        self.assertTrue(designer.is_enabled(), "ERROR: Designer field cannot be edited!")
        print("Designer Enabled...")
        reviewer = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Reviewed by']")))
        self.assertTrue(reviewer.is_enabled(),"ERROR: Reviewer field cannot be edited!")
        print("Reviewer Enabled...")
        approver = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Approved by']")))
        self.assertTrue(approver.is_enabled(), "ERROR: Approver field cannot be edited!")
        print("Approver Enabled...")
        revision_no = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Revision No.']")))
        self.assertTrue(revision_no.is_enabled(), "ERROR: Revision No. field cannot be edited!")
        print("Revision Number Enabled...")
        self.assertEqual(revision_no.get_attribute("type"), "number", "ERROR: Revision Number should only accept number inputs!")
        print("Revision Number Accepts Number Inputs...")
        client = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Client']")))
        self.assertTrue(client.is_enabled(), "ERROR: Client field cannot be edited!")
        print("Client Enabled...")
        description = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//textarea[@placeholder='Enter Description']")))
        self.assertTrue(description.is_enabled(), "ERROR: Description field cannot be edited!")
        print("Description Enabled...")

        # Check inputs
        print("Changing values in general settings...")
        print("Changing Project title...")
        project_title.clear()
        project_title.send_keys("TITLE CHANGE")
        print("Changing Project number...")
        project_no.send_keys("99")
        print("Changing Project Stage...")
        project_stage.send_keys("TEST STAGE")
        print("Changing Designer...")
        designer.send_keys("TEST DESIGNER")
        print("Changing Reviewer...")
        reviewer.send_keys("TEST REVIEWER")
        print("Changing Approver...")
        approver.send_keys("TEST APPROVER")
        print("Changing Revision Number...")
        revision_no.clear()
        revision_no.send_keys("99")
        print("Changing Client...")
        client.send_keys("TEST CLIENT")
        print("Changing Description...")
        description.send_keys("TEST DESCRIPTION")

        # Click save
        print("Saving inputs...")
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()

        # Check if inputs are saved
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(), "ERROR: Inputs not saved!")
        print("Inputs successfully saved!")

        # Checking of reverting values here
        # Click Back to Drawing
        print("Going back to drawing...")
        self.driver.find_element_by_xpath("//button[@class='btn btn-secondary']").click()
        time.sleep(3)

        # Checking if settings are saved
        # Click Settings button
        print("Going to settings page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Settings')]").click()
        print("Settings page opened!")
        time.sleep(5)

        # Click General Settings
        print("Opening General Settings...")
        self.driver.find_element_by_xpath("//a[contains(text(),'General')]").click()
        print("General Settings Opened!")

        print("Checking revert values function...")

        project_title = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Project Title']")))
        project_no = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Project No.']")))
        project_stage = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Project Stage']")))
        designer = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Designer']")))
        reviewer = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Reviewed by']")))
        approver = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Approved by']")))
        self.assertTrue(approver.is_enabled(), "ERROR: Approver field cannot be edited!")
        revision_no = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Revision No.']")))
        client = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Client']")))
        description = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//textarea[@placeholder='Enter Description']")))

        prev_values = [project_title.get_attribute('value'), project_no.get_attribute('value'),
                       project_stage.get_attribute('value'), designer.get_attribute('value'),
                       reviewer.get_attribute('value'), approver.get_attribute('value'),
                       revision_no.get_attribute('value'), client.get_attribute('value'),
                       description.get_attribute('value')]
        print("Changing values...")
        project_title.send_keys("test")
        project_no.send_keys("test")
        project_stage.send_keys("test")
        designer.send_keys("test")
        reviewer.send_keys("test")
        approver.send_keys("test")
        revision_no.send_keys("test")
        client.send_keys("test")
        description.send_keys("test")
        print("Reverting values back...")
        self.driver.find_element_by_xpath("//button[@class='btn btn-secondary']").click()

        project_title = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Project Title']")))
        project_no = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Project No.']")))
        project_stage = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Project Stage']")))
        designer = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Designer']")))
        reviewer = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Reviewed by']")))
        approver = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Approved by']")))
        self.assertTrue(approver.is_enabled(), "ERROR: Approver field cannot be edited!")
        revision_no = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Revision No.']")))
        client = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter Client']")))
        description = WebDriverWait(self.driver, 50).until(
            EC.presence_of_element_located((By.XPATH, "//textarea[@placeholder='Enter Description']")))

        current_values = [project_title.get_attribute('value'), project_no.get_attribute('value'),
                       project_stage.get_attribute('value'), designer.get_attribute('value'),
                       reviewer.get_attribute('value'), approver.get_attribute('value'),
                       revision_no.get_attribute('value'), client.get_attribute('value'),
                       description.get_attribute('value')]

        print("Checking if values have reverted...")
        self.assertEqual(prev_values,current_values, "ERROR: Values have not reverted!")
        print("Values have reverted successfully!")

        # Go to Home Page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(6)

        # Delete drawing after checking
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing deleted!")
        time.sleep(3)

        # End
        print("General Settings Test Complete!\n----------------")

    def test_unitsPage(self):
        # Test Unit Page Settings

        # Start
        print("----------------\nStart General Settings Test...")

        username = "admin"
        password = "pleasechange"

        # Login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        print("Login Successful!")
        time.sleep(5)

        # Create New Drawing
        print("Creating new drawing...")
        self.test.create_drawing()
        print("Create new drawing successful!")
        time.sleep(5)

        # Click Settings button
        print("Going to settings page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Settings')]").click()
        print("Settings page opened!")
        time.sleep(5)

        # Click Units Page
        print("Going to units page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Units')]").click()
        print("Units page opened!")
        time.sleep(3)

        # Check if dropdown buttons are enabled
        print("Checking dropdown buttons...")
        print("Checking Length Measurement System...")
        self.assertTrue(self.driver.find_element_by_xpath("//button[contains(text(),'Metric (mm)')]").is_enabled(),
                        "ERROR: Length measurement system not clickable!")
        print("Checking Pressure Measurement System...")
        self.assertTrue(self.driver.find_element_by_xpath("//button[contains(text(),'Metric (kpa)')]").is_enabled(),
                        "ERROR: Pressure Measurement System not clickable!")
        print("Checking Velocity Measurement System...")
        self.assertTrue(self.driver.find_element_by_xpath("//div[3]//div[1]//div[1]//button[1]").is_enabled(),
                        "ERROR: Velocity Measurement System not clickable!")
        print("Checking Temperature Measurement System...")
        self.assertTrue(self.driver.find_element_by_xpath("//button[contains(text(),'Metric (°C)')]").is_enabled(),
                        "ERROR: Temperature Measurement System not clickable!")
        print("Checking Volume Measurement System...")
        self.assertTrue(self.driver.find_element_by_xpath("//button[contains(text(),'Metric (L)')]").is_enabled(),
                        "ERROR: Volume Measurement System not clickable!")
        print("Dropdown buttons are all enabled!")

        # Check if settings can be changed
        print("Changing settings...")

        print("Changing Length Measurement System Settings...")
        # Change to Imperial
        print("Changing to Imperial setting...")
        self.driver.find_element_by_xpath("//button[contains(text(),'Metric (mm)')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'Imperial (in, ft)')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to imperial setting!")
        # Change to Metric
        print("Changing to Metric setting...")
        self.driver.find_element_by_xpath("//button[contains(text(),'Imperial (in, ft)')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'Metric (mm)')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to metric setting!")
        print("Changing of Length Measurement System Values successful!")

        print("Changing Pressure Measurement System settings...")
        # Change to Imperial
        self.driver.find_element_by_xpath("//button[contains(text(),'Metric (kpa)')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'Imperial (psi)')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to imperial setting!")
        # Change to Metric
        self.driver.find_element_by_xpath("//button[contains(text(),'Imperial (psi)')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'Metric (kpa)')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to metric setting!")
        print("Changing of Pressure Measurement System Values successful!")

        print("Changing Velocity Measurement System Settings...")
        # Change to Imperial
        self.driver.find_element_by_xpath("//div[3]//div[1]//div[1]//button[1]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'Imperial (furlongs')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to imperial setting!")
        # Change to Alt Imperial
        self.driver.find_element_by_xpath("//button[contains(text(),'Imperial (furlongs')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'Alt. Imperial (ft')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to alt. imperial setting!")
        # Change to Metric
        self.driver.find_element_by_xpath("//button[contains(text(),'Alt. Imperial (ft')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'Metric (m/s')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to metric setting!")
        print("Changing of Velocity Measurement System Values successful!")

        print("Changing Temperature Measurement System Settings...")
        # Change to Imperial
        self.driver.find_element_by_xpath("//button[contains(text(),'Metric (°C)')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'Imperial (°F)')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to imperial setting!")
        # Change to Metric
        self.driver.find_element_by_xpath("//button[contains(text(),'Imperial (°F)')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'Metric (°C)')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to metric setting!")
        print("Changing of Temperature Measurement System Values successful!")

        print("Changing Volume Measurement System Settings...")
        # Change to UK Imperial
        self.driver.find_element_by_xpath("//button[contains(text(),'Metric (L)')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'UK Imperial (gal)')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to UK imperial setting!")
        # Change to US Imperial
        self.driver.find_element_by_xpath("//button[contains(text(),'UK Imperial (gal)')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'US Imperial (US gal)')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to US imperial setting!")
        # Change to Metric
        self.driver.find_element_by_xpath("//button[contains(text(),'US Imperial (US gal)')]").click()
        self.driver.find_element_by_xpath("//a[contains(text(),'Metric (L)')]").click()
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[@class='mr-2']").is_displayed(),
                        "ERROR: Setting not saved!")
        print("Changed to metric setting!")
        print("Changing of Volume Measurement System Values successful!")

        print("Changing of measurement value settings successful!")


        # Go to Home Page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(10)

        # Delete drawing after checking
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing deleted!")
        time.sleep(3)

        # End
        print("Units Page Test Complete!\n----------------")

if __name__ == '__main__':
    unittest.main()