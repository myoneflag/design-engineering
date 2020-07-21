import unittest
import time
from methods import methods
from selenium.webdriver.common.action_chains import ActionChains

# This script tests login page

class test_loginPage(unittest.TestCase):

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

    def test_login_by_button_click(self):

        # Start
        print("----------------\nStart Login by Button Click Test...")
        # Change line below for any valid input for username
        username = "admin"

        # Change line below for any valid input for password
        password = "pleasechange"

        # Perform login
        print("Logging in...")
        self.test.login_by_button_click(username, password)


        # Validate login
        time.sleep(2)
        self.assertTrue(self.driver.find_element_by_class_name("title"))
        print("Login Successful!")

        # End
        print("Login by Button Click Test Complete!\n----------------")

    def test_login_by_enter_key(self):
        # Change line below for any valid input for username
        username = "admin"

        # Change line below for any valid input for password
        password = "pleasechange"

        # Start
        print("----------------\nStart Login by Enter Key Test...")

        # Perform login
        print("Logging in...")
        self.test.login_by_enter_key(username, password)

        # Validate login
        time.sleep(2)
        self.assertTrue(self.driver.find_element_by_class_name("title"))
        print("Login Successful!")

        # End
        print("Login by Enter Key Test Complete!\n----------------")

    def test_create_drawing(self):
        # Change line below for any valid input for username
        username = "admin"

        # Change line below for any valid input for password
        password = "pleasechange"

        # Start
        print("----------------\nStart Create Drawing Test...")

        # Perform login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        print("Login Succesfful!")
        time.sleep(2)

        # Create New Drawing
        print("Creating new drawing...")
        self.test.create_drawing()
        time.sleep(10)
        print("Create new drawing successful!")

        # Check Drawing
        print("Checking drawing...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(10)
        checker = self.driver.find_element_by_xpath("//div[@class='home container']//div[1]//article[1]//div[1]//h4[1]")\
            .text
        if checker == "NEW DRAWING":
            is_true = True
            print("Drawing found!")
        else:
            is_true = False
            print("Drawing not found!")
        self.assertTrue(is_true)

        # Delete file after checking
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Delete successful!")

        # End
        print("Create Drawing Test Complete!\n----------------")

    def test_copy_drawing(self):
        # Change line below for any valid input for username
        username = "admin"

        # Change line below for any valid input for password
        password = "pleasechange"

        # Start
        print("----------------\nStart Copy Drawing Test...")

        # Perform login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        time.sleep(2)
        print("Login successful!")

        # Create New Drawing
        print("Creating new drawing...")
        self.test.create_drawing()
        time.sleep(5)
        print("Creation successful!")

        # Create a Copy
        print("Creating duplicate drawing...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(6)
        title = self.driver.find_element_by_xpath("//div[@class='home container']//div[1]//article[1]//div[1]//h4[1]") \
                    .text
        self.driver.find_element_by_xpath("//div[@class='home container']//div[1]//article[1]"
                                          "//div[1]//div[1]//button[1]").click()
        self.driver.find_element_by_xpath("//ul[@class='dropdown-menu show']//a[@class='dropdown-item'][contains(text()"
                                          ",'Make Copy')]").click()
        print("Duplication successful!")

        # Validate copy
        print("Checking duplicate...")
        checker = "Copy of " + title
        if checker == "Copy of NEW DRAWING":
            is_true = True
            print("Duplicate found!")
        else:
            is_true = False
            print("Duplicate not found!")
        self.assertTrue(is_true)

        # Refresh page
        self.driver.refresh()
        time.sleep(10)

        # Delete copy after checking
        print("Deleting original drawing...")
        self.test.delete_drawing()
        time.sleep(5)
        print("Deleting successful!")

        # Delete original after checking
        print("Deleting duplicate drawing...")
        self.test.delete_drawing()
        time.sleep(5)
        print("Deleting successful!")


        # End
        print("Create Drawing Test Complete!\n----------------")


    def test_org_checker(self):
        # Checks all drawings if it belongs to user organization

        # Change line below for any valid input for username
        username = "admin"

        # Change line below for any valid input for password
        password = "pleasechange"

        # Start
        print("----------------\nStart Organization Check Test...")

        # Perform login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        time.sleep(2)
        print("Login successful!")

        # Check each drawing
        print("Checking drawings by organization...")
        org_counter = len(self.driver.find_elements_by_xpath("//*[@id='app']/div/div/div/div[5]/div"))
        for i in range (1, org_counter + 1):
            org_checker = self.driver.find_element_by_xpath(f"//*[@id='app']/div/div/div/div[5]/div[{i}]/article/div"
                                                            f"/p/table/tr[3]/td[2]").text
            self.assertEqual(org_checker, "Test Orgnaization")
        print("All drawings belong to user organization!")

        # End
        print("Organization Check Test Complete!\n----------------")



if __name__ == '__main__':
    unittest.main()

