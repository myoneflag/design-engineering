import unittest
import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import os

from methods import methods


# This script tests uploading a pdf file

class test_floorplan(unittest.TestCase):
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

    def test_uploadFile(self):
        username = "admin"
        password = "pleasechange"

        # Uncomment line below for valid upload. Also Change path to where pdf.pdf is located
        file = os.getcwd() + "/pdf.pdf"

        # Uncomment line below for invalid upload. Also Change path to where pdf.txt is located
        # file = os.getcwd() + "/pdf.txt"

        # Start
        print("----------------\nStart Upload PDF Test...")

        # Login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        print("Login successful!")

        # Test file upload
        time.sleep(3)
        print("Uploading file...")
        self.test.upload_pdf(file)
        print("Upload successful!")

        # Check uploaded file
        print("Checking file...")
        try:
            time.sleep(1)
            self.driver.find_element_by_xpath("//header[@class='toast-header']")
            not_found = False
            print("File not found!")
        except:
            not_found = True

        self.assertTrue(not_found)
        print("File found!")

        # Go to Home page
        self.driver.find_element_by_xpath("/html/body/div[1]/div/div/div[2]/nav/ul[1]/li/a").click()
        time.sleep(7)

        # Delete drawing after validation
        print("Deleting drawing...")
        self.test.delete_drawing()
        time.sleep(5)
        print("Drawing deleted!")
        print("Upload PDFTest Complete!\n----------------")

    def test_replace_pdf(self):
        username = "admin"
        password = "pleasechange"

        # Uncomment line below for valid upload. Also Change path to where pdf.pdf is located
        file = os.getcwd() + "/pdf.pdf"

        # Replacement file
        file_2 = os.getcwd() + "/pdf-test.pdf"

        # Start
        print("----------------\nStart Replace PDF Test...")

        # Login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        print("Login successful!")

        # Upload original file
        time.sleep(3)
        print("Uploading original pdf...")
        self.test.upload_pdf(file)
        time.sleep(5)
        print("Uploading original pdf complete.")

        # Click canvas
        self.driver.find_element_by_xpath("//div[@class='fullFrame']//canvas").click()

        # Upload replacement file
        print("Uploading replacement pdf...")
        self.driver.find_element_by_xpath("//input[@class='custom-file-input is-invalid']").send_keys(file_2)
        print("Uploading replacement pdf successful!")
        time.sleep(5)

        # Check for error
        print("Checking for error...")
        try:
            time.sleep(1)
            self.driver.find_element_by_xpath("//header[@class='toast-header']")
            not_found = False
            print("File not replaced!")
        except:
            not_found = True

        self.assertTrue(not_found)
        print("PDF successfully replaced!")

        # Go to Home page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(7)

        # Delete drawing after validation
        print("Deleting drawing...")
        self.test.delete_drawing()
        time.sleep(5)
        print("Drawing deleted!")

        print("Replace PDF Test Complete!\n----------------")

    def test_addlevel(self):
        username = "admin"
        password = "pleasechange"

        # Start
        print("----------------\nStart Add Level Test...")

        # Perform login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        time.sleep(2)
        print("Login successful!")

        # Create New Drawing
        print("Creating new drawing...")
        self.test.create_drawing()
        time.sleep(5)
        print("Create new drawing successful!")

        # Add level above
        print("Adding level above ground...")
        self.driver.find_element_by_xpath("//button[contains(text(),'LVL')]").click()
        print("Adding level above ground successful.")

        # Add level below
        print("Adding basement level...")
        self.driver.find_element_by_xpath("//button[contains(text(),'B')]").click()
        print("Adding basement level successful.")

        # Check the added upper level
        print("Checking levels...")
        try:
            time.sleep(1)
            self.driver.find_element_by_xpath("//div[contains(text(),'L1')]")
            found_upper = True
            print("Upper level found!")
        except:
            found_upper = False
            print("Upper level not found!")
        self.assertTrue(found_upper)

        # Check the added basement level
        try:
            time.sleep(1)
            self.driver.find_element_by_xpath("//div[contains(text(),'B1')]")
            found_basement = True
            print("Basement level found!")
        except:
            found_basement = False
            print("Upper level not found!")
        self.assertTrue(found_basement)

        # Go to Home page
        self.driver.find_element_by_xpath("/html/body/div[1]/div/div/div[2]/nav/ul[1]/li/a").click()
        time.sleep(7)

        # Delete created drawing
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing successfully deleted!")
        print("Adding Level Test Complete!\n----------------")

    def test_deletelevel(self):
        username = "admin"
        password = "pleasechange"

        # Start
        print("----------------\nStart Add Level Test...")

        # Perform login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        time.sleep(2)
        print("Login successful!")

        # Create New Drawing
        print("Creating new drawing...")
        self.test.create_drawing()
        time.sleep(5)
        print("Create new drawing successful!")

        # Add level above
        print("Adding level above ground...")
        self.driver.find_element_by_xpath("//button[contains(text(),'LVL')]").click()
        print("Adding level above ground successful.")

        # Add level below
        print("Adding basement level...")
        self.driver.find_element_by_xpath("//button[contains(text(),'B')]").click()
        print("Adding basement level successful.")

        # Go to home page to save changes
        print("Going back to home page...")
        # Go to Home page
        self.driver.find_element_by_xpath("/html/body/div[1]/div/div/div[2]/nav/ul[1]/li/a").click()
        time.sleep(7)
        print("Go to homepage successful!")

        # Open created drawing
        print("Opening created drawing...")
        self.driver.find_element_by_xpath(
            "//body/div/div/div[@class='isEmailVerification']/div[@class='home container']"
            "/div[@class='row']/div[1]/article[1]/div[1]/div[1]/a[1]").click()
        time.sleep(3)
        print("Open created drawing successful!")

        # Open level drawer
        print("Opening level drawer...")
        self.driver.find_element_by_xpath("//body/div/div/div/div/div[@class='level-selector']/div[@class='list-group']"
                                          "/button[1]").click()
        print("Open level drawer successful")

        # Delete upper level
        print("Deleting upper level...")
        self.driver.find_element_by_xpath("//button[1]//div[1]//div[7]//button[1]").click()
        time.sleep(2)
        self.driver.find_element_by_xpath("//button[@class='btn btn-primary']").click()
        print("Deleting upper level successful!")

        # Delete basement level
        print("Deleting basement level...")
        self.driver.find_element_by_xpath("//button[@class='list-group-item levelBtn list-group-item-outline-dark"
                                          " list-group-item-action']//button[@class='btn btn-danger btn-sm']").click()
        time.sleep(2)
        self.driver.find_element_by_xpath("//button[@class='btn btn-primary']").click()
        print("Deleting basement level successful!")

        # Close level drawer
        print("Closing level drawer...")
        self.driver.find_element_by_xpath("//body/div/div/div/div/div[@class='level-selector']/div[@class='list-group']"
                                          "/button[1]").click()
        print("Closing level drawer successful")

        # Check the deleted upper level
        print("Checking levels...")
        try:
            time.sleep(1)
            self.driver.find_element_by_xpath("//div[contains(text(),'L1')]")
            found_upper = True
            print("Upper level found!")
        except:
            found_upper = False
            print("Upper level not found!")
        self.assertFalse(found_upper)

        # Check the deleted basement level
        try:
            time.sleep(1)
            self.driver.find_element_by_xpath("//div[contains(text(),'B1')]")
            found_basement = True
            print("Basement level found!")
        except:
            found_basement = False
            print("Upper level not found!")
        self.assertFalse(found_basement)

        # Go to Home page
        self.driver.find_element_by_xpath("/html/body/div[1]/div/div/div[2]/nav/ul[1]/li/a").click()
        time.sleep(7)

        # Delete created drawing
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing successfully deleted!")
        print("Deleting Level Test Complete!\n----------------")

    def test_changelevelheight(self):
        username = "admin"
        password = "pleasechange"

        # Start
        print("----------------\nStart Change Level Height Test...")

        # Perform login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        time.sleep(2)
        print("Login successful!")

        # Create New Drawing
        print("Creating new drawing...")
        self.test.create_drawing()
        time.sleep(5)
        print("Create new drawing successful!")

        # Add level above
        print("Adding level above ground...")
        self.driver.find_element_by_xpath("//button[contains(text(),'LVL')]").click()
        print("Adding level above ground successful.")

        # Add level below
        print("Adding basement level...")
        self.driver.find_element_by_xpath("//button[contains(text(),'B')]").click()
        print("Adding basement level successful.")

        # Open level drawer
        print("Opening level drawer...")
        self.driver.find_element_by_xpath("//body/div/div/div/div/div[@class='level-selector']/div[@class='list-group']"
                                          "/button[1]").click()
        print("Open level drawer successful")

        # Change upper level height
        print("Changing upper level height...")
        self.driver.find_element_by_xpath("//button[1]//div[1]//div[4]//div[1]//input[1]").click()
        self.driver.find_element_by_xpath("//button[1]//div[1]//div[4]//div[1]//input[1]").send_keys(Keys.BACK_SPACE)
        self.driver.find_element_by_xpath("//button[1]//div[1]//div[4]//div[1]//input[1]").send_keys("99")
        print("Changing upper level height successful!")

        # Change basement level height
        print("Changing basement level height...")
        self.driver.find_element_by_xpath("//button[3]//div[1]//div[4]//div[1]//input[1]").click()
        self.driver.find_element_by_xpath("//button[3]//div[1]//div[4]//div[1]//input[1]").send_keys(Keys.BACK_SPACE)
        self.driver.find_element_by_xpath("//button[3]//div[1]//div[4]//div[1]//input[1]").send_keys(Keys.BACK_SPACE)
        self.driver.find_element_by_xpath("//button[3]//div[1]//div[4]//div[1]//input[1]").send_keys("-99")
        print("Changing basement level height successful")

        # Close level drawer
        print("Closing level drawer...")
        self.driver.find_element_by_xpath("//body/div/div/div/div/div[@class='level-selector']/div[@class='list-group']"
                                          "/button[1]").click()
        print("Closing level drawer successful")

        # Open level drawer
        print("Opening level drawer...")
        self.driver.find_element_by_xpath("//body/div/div/div/div/div[@class='level-selector']/div[@class='list-group']"
                                          "/button[1]").click()
        print("Open level drawer successful")

        # Check height changes
        print("Checking height changes...")
        upper_height = self.driver.find_element_by_xpath("//button[1]//div[1]//div[4]//div[1]//input[1]")\
            .get_attribute("value")
        self.assertEqual(upper_height, "99")
        basement_height = self.driver.find_element_by_xpath("//button[3]//div[1]//div[4]//div[1]//input[1]")\
            .get_attribute("value")
        self.assertEqual(basement_height, "-99")
        print("Height changes saved!")

        # Close level drawer
        print("Closing level drawer...")
        self.driver.find_element_by_xpath("//body/div/div/div/div/div[@class='level-selector']/div[@class='list-group']"
                                          "/button[1]").click()
        print("Closing level drawer successful")

        # Go to Home page
        self.driver.find_element_by_xpath("/html/body/div[1]/div/div/div[2]/nav/ul[1]/li/a").click()
        time.sleep(7)

        # Delete created drawing
        print("Deleting drawing...")
        self.test.delete_drawing()
        print(5)
        print("Drawing successfully deleted!")
        print("Change Level Height Test Complete!\n----------------")


if __name__ == '__main__':
    unittest.main()
