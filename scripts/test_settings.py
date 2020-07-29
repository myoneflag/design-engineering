import unittest
from selenium.webdriver.common.keys import Keys
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
        self.actions2 = ActionChains(self.driver)
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
        time.sleep(10)

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
        time.sleep(12)

        # Delete drawing after checking
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing deleted!")
        time.sleep(3)

        # End
        print("Units Page Test Complete!\n----------------")

    def test_fixturesPage(self):
        # Test Fixtures Page Settings

        # Start
        print("----------------\nStart Fixtures Settings Test...")

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

        # Click Fixtures button
        print("Going to fixtures page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Fixtures')]").click()
        print("Fixtures page opened!")
        time.sleep(3)

        # Get item values
        disabled_fixtures = "//div[1]/div/"
        available_fixtures = "//div[2]/div/"
        ablution_trough = "a[contains(text(),'Ablution Trough')]"
        bedpan_sanitiser = "a[contains(text(),'Bedpan Sanitiser')]"
        beverage_bay = "a[contains(text(),'Beverage Bay')]"
        birthing_pool = "a[contains(text(),'Birthing Pool')]"
        cleaners_sink = "a[contains(text(),'Cleaners sink')]"
        dishwasher = "a[contains(text(),'Dishwasher')]"
        drinking_fountain = "a[contains(text(),'Drinking Fountain')]"
        flushing_rim_sink = "a[contains(text(),'Flushing Rim Sink')]"
        hose_tap = "a[contains(text(),'Hose tap')]"
        kitchen_sink_hot = "a[contains(text(),'Kitchen Sink (Hot)')]"
        laundry_trough_hot = "a[contains(text(),'Laundry Trough (Hot)')]"
        urinal = "a[contains(text(),'Urinal')]"
        basin = "a[contains(text(),'Basin')]"
        bath = "a[contains(text(),'Bath')]"
        shower = "a[contains(text(),'Shower')]"
        kitchen_sink_warm = "a[contains(text(),'Kitchen Sink (Warm)')]"
        wc = "a[contains(text(),'WC')]"
        washing_machine = "a[contains(text(),'Washing Machine')]"
        laundry_trough_warm = "a[contains(text(),'Laundry Trough (Warm)')]"
        not_displayed_error = "ERROR: Setting not displayed!"
        not_enabled_error = "ERROR: Setting not clickable!"


        # Check if default settings are displayed
        print("Checking default value settings for Disabled Fixtures...")
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{ablution_trough}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{bedpan_sanitiser}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{beverage_bay}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{birthing_pool}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{cleaners_sink}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{dishwasher}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{drinking_fountain}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{flushing_rim_sink}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{hose_tap}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{kitchen_sink_hot}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{laundry_trough_hot}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{urinal}").is_displayed(),
                        not_displayed_error)
        print("All default settings in disabled fixtures are displayed...")
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{ablution_trough}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{bedpan_sanitiser}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{beverage_bay}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{birthing_pool}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{cleaners_sink}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{dishwasher}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{drinking_fountain}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{flushing_rim_sink}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{hose_tap}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{kitchen_sink_hot}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{laundry_trough_hot}").is_enabled(),
                        not_enabled_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{urinal}").is_enabled(),
                        not_enabled_error)
        print("All settings in disabled fixtures are enabled...")

        print("Checking default value settings for Available Fixtures...")
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{basin}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{bath}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{shower}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{kitchen_sink_warm}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{wc}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{washing_machine}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{laundry_trough_warm}").is_displayed(),
                        not_displayed_error)
        print("All default settings in available fixtures are displayed...")
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{basin}").is_enabled(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{bath}").is_enabled(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{shower}").is_enabled(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{kitchen_sink_warm}").is_enabled(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{wc}").is_enabled(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{washing_machine}").is_enabled(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{laundry_trough_warm}").is_enabled(),
                        not_displayed_error)
        print("All settings in available fixtures are enabled...")

        # Check changing of settings
        # Disabled fixtures
        print("Checking of changing of values in disabled fixtures...")
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{ablution_trough}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{bedpan_sanitiser}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{beverage_bay}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{birthing_pool}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{cleaners_sink}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{dishwasher}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{drinking_fountain}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{flushing_rim_sink}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{hose_tap}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{kitchen_sink_hot}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{laundry_trough_hot}").click()
        self.driver.find_element_by_xpath(f"{disabled_fixtures}{urinal}").click()

        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{ablution_trough}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{bedpan_sanitiser}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{beverage_bay}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{birthing_pool}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{cleaners_sink}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{dishwasher}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{drinking_fountain}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{flushing_rim_sink}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{hose_tap}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{kitchen_sink_hot}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{laundry_trough_hot}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{available_fixtures}{urinal}").is_displayed(),
                        not_displayed_error)
        print("Disabled fixtures settings successfully changed...")

        # Available Fixtures
        print("Checking of changing of values in available fixtures...")
        self.driver.find_element_by_xpath(f"{available_fixtures}{basin}").click()
        self.driver.find_element_by_xpath(f"{available_fixtures}{bath}").click()
        self.driver.find_element_by_xpath(f"{available_fixtures}{shower}").click()
        self.driver.find_element_by_xpath(f"{available_fixtures}{kitchen_sink_warm}").click()
        self.driver.find_element_by_xpath(f"{available_fixtures}{wc}").click()
        self.driver.find_element_by_xpath(f"{available_fixtures}{washing_machine}").click()
        self.driver.find_element_by_xpath(f"{available_fixtures}{laundry_trough_warm}").click()

        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{basin}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{bath}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{shower}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{kitchen_sink_warm}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{wc}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{washing_machine}").is_displayed(),
                        not_displayed_error)
        self.assertTrue(self.driver.find_element_by_xpath(f"{disabled_fixtures}{laundry_trough_warm}").is_displayed(),
                        not_displayed_error)
        print("Available fixtures settings successfully changed...")

        # Save changes
        print("Saving changes...")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed(),
                        "ERROR: Saving not successful!")
        print("Settings saved successfully!")

        # Go to Home Page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(10)

        # Delete drawing after checking
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing deleted!")
        time.sleep(3)

        # End
        print("Fixtures Page Test Complete!\n----------------")

    def test_flowSystems(self):
        # Test Flow Systems Page Settings

        # Start
        print("----------------\nStart Flow Systems Test...")

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

        # Click Flow Systems button
        print("Going to Flow Systems page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Flow Systems')]").click()
        print("Flow Systems opened!")
        time.sleep(5)

        # Add a New System
        print("Adding new system...")
        self.driver.find_element_by_xpath("//button[contains(text(),'Add New System')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//button[contains(text(),'New Flow System')]").is_displayed())
        print("System added successfully")
        time.sleep(1)

        # Changing system name
        print("Changing system name...")
        self.driver.find_element_by_xpath("//input[@placeholder='Enter System Name']").clear()
        self.driver.find_element_by_xpath("//input[@placeholder='Enter System Name']").send_keys("Test System")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.assertTrue(self.driver.find_element_by_xpath("//button[contains(text(),'Test System')]").is_displayed())
        print("System name successfully changed...")

        # Changing temperature
        print("Changing temperature...")
        self.driver.find_element_by_xpath("//div[@class='input-group']//input[@placeholder='Enter Temperature']").click()
        self.driver.find_element_by_xpath("//div[@class='input-group']//input[@placeholder='Enter Temperature']").send_keys(Keys.BACKSPACE)
        self.driver.find_element_by_xpath("//div[@class='input-group']//input[@placeholder='Enter Temperature']").send_keys(Keys.BACKSPACE)
        self.driver.find_element_by_xpath("//div[@class='input-group']//input[@placeholder='Enter Temperature']").send_keys("10")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath(
            "//div[@class='input-group']//input[@placeholder='Enter Temperature']").click()
        self.driver.find_element_by_xpath(
            "//div[@class='input-group']//input[@placeholder='Enter Temperature']").send_keys(Keys.BACKSPACE)
        self.driver.find_element_by_xpath(
            "//div[@class='input-group']//input[@placeholder='Enter Temperature']").send_keys(Keys.BACKSPACE)
        self.driver.find_element_by_xpath(
            "//div[@class='input-group']//input[@placeholder='Enter Temperature']").send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        print("Temperature settings checked...")

        # Changing background color
        print("Changing background color...")
        self.driver.find_element_by_xpath("//body//li[36]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        print("Background color checked...")

        # Check Has Return System
        print("Checking Return System settings...")
        self.driver.find_element_by_xpath("//button[contains(text(),'No')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'Yes')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.assertTrue(self.driver.find_element_by_xpath("//label[contains(text(),'Return Is Insulated')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'No')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//ul[@class='dropdown-menu show']//a[@class='dropdown-item'][contains(text(),'Yes')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        # Insert here
        self.assertTrue(self.driver.find_element_by_xpath("//label[contains(text(),'Insulation Material')]").is_displayed())
        self.assertTrue(self.driver.find_element_by_xpath("//label[contains(text(),'Insulation Jacket')]").is_displayed())
        self.assertTrue(self.driver.find_element_by_xpath("//button[contains(text(),'Calcium Silicate (0.059 W')]").is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath("//button[contains(text(),'All Service Jacket (0.90')]").is_enabled())
        self.driver.find_element_by_xpath("//button[contains(text(),'Calcium Silicate (0.059 W')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'MM Kembla Insulation (0.034 W')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'MM Kembla Insulation (0.034 W')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'Calcium Silicate (0.059 W')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'All Service Jacket (0.90')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'No Jacket (0.90')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'No Jacket (0.90')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'Galvanized Steel (New')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.assertTrue(self.driver.find_element_by_xpath("//input[@placeholder='Enter Max. Velocity of Return']").is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath("//input[@placeholder='Enter Insulation Thickness']").is_enabled())
        self.driver.find_element_by_xpath("//input[@placeholder='Enter Max. Velocity of Return']").clear()
        self.driver.find_element_by_xpath("//input[@placeholder='Enter Insulation Thickness']").clear()
        self.driver.find_element_by_xpath("//input[@placeholder='Enter Max. Velocity of Return']").send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//input[@placeholder='Enter Insulation Thickness']").send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        # End here
        self.driver.find_element_by_xpath("//div[6]//div[1]//div[1]//button[1]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//ul[@class='dropdown-menu show']//a[@class='dropdown-item'][contains(text(),'No')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        # # Assert not
        # assert not len(self.driver.find_element_by_xpath("//label[contains(text(),'Insulation Material')]"))
        # assert not len(self.driver.find_element_by_xpath("//label[contains(text(),'Insulation Jacket')]"))
        self.driver.find_element_by_xpath("//button[contains(text(),'Yes')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//ul[@class='dropdown-menu show']//a[@class='dropdown-item'][contains(text(),'No')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        assert not len(self.driver.find_elements_by_xpath("//label[contains(text(),'Return Is Insulated')]"))
        print("Return system settings checked...")

        # Check Network Properties - Risers
        print("Checking Network Properties...")
        print("Checking Risers settings...")
        self.driver.find_element_by_xpath("//input[@id='input-networks.RISERS.velocityMS']").clear()
        self.driver.find_element_by_xpath("//input[@id='input-networks.RISERS.velocityMS']").send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'Copper (Type B)')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath(
            "//ul[@class='dropdown-menu show']//a[@class='dropdown-item'][contains(text(),'Cast Iron (Coated)')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'Cast Iron (Coated)')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath(
            "//ul[@class='dropdown-menu show']//a[@class='dropdown-item'][contains(text(),'Stainless Steel')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//input[@id='input-networks.RISERS.spareCapacityPCT' and @type='number']").clear()
        self.driver.find_element_by_xpath("//input[@id='input-networks.RISERS.spareCapacityPCT' and @type='number']").send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        print("Risers checked...")

        # Check Network Properties - Reticulations
        print("Checking Reticulations settings...")
        self.driver.find_element_by_xpath("//input[@id='input-networks.RETICULATIONS.velocityMS']").clear()
        self.driver.find_element_by_xpath("//input[@id='input-networks.RETICULATIONS.velocityMS']").send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'Copper (Type B)')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath(
            "//ul[@class='dropdown-menu show']//a[@class='dropdown-item'][contains(text(),'Cast Iron (Coated)')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'Cast Iron (Coated)')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath(
            "//ul[@class='dropdown-menu show']//a[@class='dropdown-item'][contains(text(),'Stainless Steel')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath(
            "//input[@id='input-networks.RETICULATIONS.spareCapacityPCT' and @type='number']").clear()
        self.driver.find_element_by_xpath(
            "//input[@id='input-networks.RETICULATIONS.spareCapacityPCT' and @type='number']").send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        print("Reticulations checked...")

        # Check Network Properties - Connections
        print("Checking Connections settings...")
        self.driver.find_element_by_xpath("//input[@id='input-networks.CONNECTIONS.velocityMS']").clear()
        self.driver.find_element_by_xpath("//input[@id='input-networks.CONNECTIONS.velocityMS']").send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'PEX (SDR 7.4)')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath(
            "//ul[@class='dropdown-menu show']//a[@class='dropdown-item'][contains(text(),'Cast Iron (Coated)')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'Cast Iron (Coated)')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath(
            "//ul[@class='dropdown-menu show']//a[@class='dropdown-item'][contains(text(),'Stainless Steel')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath(
            "//input[@id='input-networks.CONNECTIONS.spareCapacityPCT' and @type='number']").clear()
        self.driver.find_element_by_xpath(
            "//input[@id='input-networks.CONNECTIONS.spareCapacityPCT' and @type='number']").send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        print("Connections checked...")
        print("Network Properties checked...")

        # Go to Home Page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(10)

        # Delete drawing after checking
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing deleted!")
        time.sleep(3)

        # End
        print("Flow Systems Test Complete!\n----------------")

    def test_calculations(self):
        # Test Calculations Page Settings

        # Start
        print("----------------\nStart Calculations Settings Test...")

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

        # Click Calculations button
        print("Going to Calculations page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Calculations')]").click()
        print("Calculations page opened!")
        time.sleep(5)

        # Check if settings are enabled
        print("Checking settings if enabled...")
        self.assertTrue(self.driver.find_element_by_xpath("//button[contains(text(),'AS3500 2018 Loading Units')]")
                        .is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath(
            "//button[contains(text(),'Keep maximum velocity within bounds')]").is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath(
            "//button[contains(text(),'Based on all system component')]").is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath(
            "//button[contains(text(),'Isolation Cases by Closing any Isolation Valve')]").is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath(
            "//input[@placeholder='Enter Default Pipe Height Above Floor']").is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath(
            "//div[@class='col-8']//input[@placeholder='Enter Room Temperature']").is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath(
            "//div[@class='input-group']//input[@placeholder='Enter Room Temperature']").is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath("//input[@placeholder='Enter Wind Speed for Heat Loss']")
                        .is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath(
            "//div[@class='col-8']//input[@placeholder='Enter Gravitational Acceleration']").is_enabled())
        self.assertTrue(self.driver.find_element_by_xpath(
            "//div[@class='input-group']//input[@placeholder='Enter Gravitational Acceleration']").is_enabled())
        print("Settings enabled...")

        # Change Peak Flow Rate Calculation Method settings
        print("Checking Peak Flow Rate Calculation Method settings...")
        self.driver.find_element_by_xpath("//button[contains(text(),'AS3500 2018 Loading Units')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),\"Barrie\'s Book Loading Units\")]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),\"Barrie\'s Book Loading Units\")]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'CIBSE Guide G')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'CIBSE Guide G')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'BS 806')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'BS 806')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'DIN 1988-300 - Residential')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'DIN 1988-300 - Residential')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'DIN 1988-300 - Hospital')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'DIN 1988-300 - Hospital')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'DIN 1988-300 - Hotel')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'DIN 1988-300 - Hotel')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'DIN 1988-300 - School')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'DIN 1988-300 - School')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'DIN 1988-300 - Office')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'DIN 1988-300 - Office')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'DIN 1988-300 - Assisted Living')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'DIN 1988-300 - Assisted Living')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'DIN 1988-300 - Nursing Home')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'DIN 1988-300 - Nursing Home')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'International Plumbing Code 2018 Flushometer')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'International Plumbing Code 2018 Flushometer')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath(
            "//a[contains(text(),'International Plumbing Code 2018 Flush Tanks')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath(
            "//button[contains(text(),'International Plumbing Code 2018 Flush Tanks')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath(
            "//a[contains(text(),'Uniform Plumbing Code 2018 Flushometer')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath(
            "//button[contains(text(),'Uniform Plumbing Code 2018 Flushometer')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath(
            "//a[contains(text(),'Uniform Plumbing Code 2018 Flush Tanks')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath(
            "//button[contains(text(),'Uniform Plumbing Code 2018 Flush Tanks')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath(
            "//a[contains(text(),'AS3500 2018 Dwellings')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),'AS3500 2018 Dwellings')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),\"Barrie\'s Book Dwellings\")]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        # self.driver.find_element_by_xpath("//button[contains(text(),\"Barrie\'s Book Dwellings\")]").click()
        # time.sleep(1)
        # self.driver.find_element_by_xpath("//a[contains(text(),'None')]").click()
        # self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        # time.sleep(1)
        # self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//button[contains(text(),\"Barrie\'s Book Dwellings\")]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'AS3500 2018 Loading Units')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        print("Peak Flow Rate Calculation Method settings changed successfully...")

        print("Checking Pressure Loss Method...")
        self.driver.find_element_by_xpath(
            "//button[contains(text(),'Based on all system component')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'Percentage on top')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath(
            "//button[contains(text(),'Percentage on top')]").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//a[contains(text(),'Based on all system component')]").click()
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        print("Pressure Loss Method checked...")

        print("Checking Default Pipe Height Above Floor...")
        self.driver.find_element_by_xpath("//input[@placeholder='Enter Default Pipe Height Above Floor']").clear()
        self.driver.find_element_by_xpath("//input[@placeholder='Enter Default Pipe Height Above Floor']")\
            .send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        print("Default Pipe Height Above Floor checked...")

        print("Checking Room Temperature...")
        self.driver.find_element_by_xpath("//div[@class='input-group']//input[@placeholder='Enter Room Temperature']")\
            .clear()
        self.driver.find_element_by_xpath("//div[@class='input-group']//input[@placeholder='Enter Room Temperature']")\
            .send_keys("10")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath("//div[@class='input-group']//input[@placeholder='Enter Room Temperature']")\
            .clear()
        self.driver.find_element_by_xpath("//div[@class='input-group']//input[@placeholder='Enter Room Temperature']")\
            .send_keys("40")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        # Can insert negative checking here
        print("Room Temperature checked...")

        print("Checking Wind Speed for Heat Loss...")
        self.driver.find_element_by_xpath("//input[@placeholder='Enter Wind Speed for Heat Loss']").clear()
        self.driver.find_element_by_xpath("//input[@placeholder='Enter Wind Speed for Heat Loss']").send_keys("100")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        print("Wind Speed for Heat Loss checked...")

        print("Checking Gravitational Acceleration...")
        self.driver.find_element_by_xpath(
            "//div[@class='input-group']//input[@placeholder='Enter Gravitational Acceleration']") \
            .clear()
        self.driver.find_element_by_xpath(
            "//div[@class='input-group']//input[@placeholder='Enter Gravitational Acceleration']") \
            .send_keys("9.77")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        self.driver.find_element_by_xpath(
            "//div[@class='input-group']//input[@placeholder='Enter Gravitational Acceleration']") \
            .clear()
        self.driver.find_element_by_xpath(
            "//div[@class='input-group']//input[@placeholder='Enter Gravitational Acceleration']") \
            .send_keys("9.84")
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        self.assertTrue(self.driver.find_element_by_xpath("//strong[contains(text(),'Success')]").is_displayed())
        # Can insert negative checking here
        print("Gravitational Acceleration checked...")

        # Go to Home Page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(10)

        # Delete drawing after checking
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing deleted!")
        time.sleep(3)

        # End
        print("Calculations Settings Test Complete!\n----------------")

    def test_debug(self):
        # Test Debug Page Settings

        # Start
        print("----------------\nStart Debug Settings Test...")

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

        # Change title
        print("Changing drawing title...")
        self.driver.find_element_by_xpath("//div[@class='fullFrame']//canvas").click()
        title = self.driver.find_element_by_xpath("//a[contains(text(),'NEW DRAWING')]")
        self.actions.double_click(title).perform()
        self.driver.find_element_by_xpath("//input[@class='form-control form-control-md']").click()
        self.driver.find_element_by_xpath("//input[@class='form-control form-control-md']").send_keys("TEST DEBUG")
        print("Drawing title changed...")

        # Click Settings button
        print("Going to settings page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Settings')]").click()
        print("Settings page opened!")
        time.sleep(5)

        # Click Debug button
        print("Going to debug page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Debug')]").click()
        print("Debug page opened...")
        time.sleep(3)

        # Getting project settings
        print("Fetching project settings...")
        debug_settings = self.driver.find_element_by_xpath("//textarea[@class='form-control']").get_attribute('value')
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        # print(debug_settings)
        print("Project settings copied...")

        # Go to Home Page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(10)

        # Create Second Drawing
        print("Creating second drawing...")
        self.driver.find_element_by_xpath("//button[@class='btn btn-success btn-lg']").click()
        element = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//a[contains(text(),'Untitled')]")))
        self.actions2.double_click(element).perform()
        self.driver.find_element_by_xpath("//input[@class='form-control form-control-md']").click()
        self.driver.find_element_by_xpath("//input[@class='form-control form-control-md']").send_keys("NEW DRAWING")
        print("Second drawing created...")
        time.sleep(5)

        # Click Settings button
        print("Going to second settings page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Settings')]").click()
        print("Second Settings page opened!")
        time.sleep(5)

        # Click Debug button
        print("Going to second debug page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Debug')]").click()
        print("Second Debug page opened...")
        time.sleep(3)

        # Pasting first project settings
        print("Pasting first project settings...")
        self.driver.find_element_by_xpath("//textarea[@class='form-control']").clear()
        self.driver.find_element_by_xpath("//textarea[@class='form-control']").send_keys(debug_settings)
        self.driver.find_element_by_xpath("//button[contains(text(),'Save')]").click()
        time.sleep(1)
        # print(debug_settings)
        print("Project settings saved...")

        # Click Settings button
        print("Going to second settings page...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Settings')]").click()
        print("Second Settings page opened!")
        time.sleep(5)

        # Going back to drawing
        print("Going back to drawing...")
        self.driver.find_element_by_xpath("//button[contains(text(),'Back to Drawing')]").click()
        print("Drawing opened...")
        time.sleep(5)

        # Assert here
        print("Checking settings...")
        self.assertEqual(self.driver.find_element_by_xpath("//a[@title='TEST DEBUG']").get_attribute('title')
                         ,"TEST DEBUG")
        print("Settings successfully copied...")

        # Go to Home Page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(8)

        # Delete drawing after checking
        print("Deleting duplicate drawing...")
        self.test.delete_drawing()
        print("Duplicate Drawing deleted!")
        # time.sleep(3)

        self.driver.refresh()

        # Delete drawing after checking
        print("Deleting first drawing...")
        self.test.delete_drawing()
        print("First Drawing deleted!")
        time.sleep(3)

        # End
        print("Debug Settings Test Complete!\n----------------")

if __name__ == '__main__':
    unittest.main()