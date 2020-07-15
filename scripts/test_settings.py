import unittest
from methods import methods
from selenium.webdriver.common.action_chains import ActionChains
import time

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

        # Check Settings
        print("Checking settings...")
        project_title = self.driver.find_element_by_xpath("//input[@placeholder='Enter Project Title']")
        self.assertTrue(project_title.is_enabled(), "ERROR: Project title field cannot be edited!")
        print("Project Title Enabled...")
        project_no = self.driver.find_element_by_xpath("//input[@placeholder='Enter Project No.']")
        self.assertTrue(project_no.is_enabled(), "ERROR: Project No. field cannot be edited!")
        print("Project Number Enabled...")
        # self.assertEqual(project_no.get_attribute("type"),"number","ERROR: Project Number should only accept number inputs!")
        print("Project Number Accepts Number Inputs...")
        project_stage = self.driver.find_element_by_xpath("//input[@placeholder='Enter Project Stage']")
        self.assertTrue(project_stage.is_enabled(),"ERROR: Project stage field cannot be edited!")
        print("Project Stage Enabled...")
        designer = self.driver.find_element_by_xpath("//input[@placeholder='Enter Designer']")
        self.assertTrue(designer.is_enabled(), "ERROR: Designer field cannot be edited!")
        print("Designer Enabled...")
        reviewer = self.driver.find_element_by_xpath("//input[@placeholder='Enter Reviewed by']")
        self.assertTrue(reviewer.is_enabled(),"ERROR: Reviewer field cannot be edited!")
        print("Reviewer Enabled...")
        approver = self.driver.find_element_by_xpath("//input[@placeholder='Enter Approved by']")
        self.assertTrue(approver.is_enabled(), "ERROR: Approver field cannot be edited!")
        print("Approver Enabled...")
        revision_no = self.driver.find_element_by_xpath("//input[@placeholder='Enter Revision No.']")
        self.assertTrue(revision_no.is_enabled(), "ERROR: Revision No. field cannot be edited!")
        print("Revision Number Enabled...")
        self.assertEqual(revision_no.get_attribute("type"), "number", "ERROR: Revision Number should only accept number inputs!")
        print("Revision Number Accepts Number Inputs...")
        client = self.driver.find_element_by_xpath("//input[@placeholder='Enter Client']")
        self.assertTrue(client.is_enabled(), "ERROR: Client field cannot be edited!")
        print("Client Enabled...")
        description = self.driver.find_element_by_xpath("//textarea[@placeholder='Enter Description']")
        self.assertTrue(description.is_enabled(), "ERROR: Description field cannot be edited!")
        print("Description Enabled...")

        # Check inputs
        print("Changing values in general settings...")
        print("Chaning Project title...")
        project_title.clear()
        project_title.send_keys("TITLE CHANGE")
        print("Changing Project number...")
        project_no.send_keys("99")
        print("Chaning Project Stage...")
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

if __name__ == '__main__':
    unittest.main()