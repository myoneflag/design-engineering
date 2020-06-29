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
        # time.sleep(2)
        # self.driver.close()
        pass

    def test_login_by_button_click(self):
        # Change line below for any valid input for username
        username = "admin"

        # Change line below for any valid input for password
        password = "pleasechange"

        # Perform login
        self.test.login_by_button_click(username, password)

        # Validate login
        time.sleep(2)
        self.assertTrue(self.driver.find_element_by_class_name("title"))

    def test_login_by_enter_key(self):
        # Change line below for any valid input for username
        username = "admin"

        # Change line below for any valid input for password
        password = "pleasechange"

        # Perform login
        self.test.login_by_enter_key(username, password)

        # Validate login
        time.sleep(2)
        self.assertTrue(self.driver.find_element_by_class_name("title"))

    def test_create_drawing(self):
        # Change line below for any valid input for username
        username = "admin"

        # Change line below for any valid input for password
        password = "pleasechange"

        # Perform login
        self.test.login_by_button_click(username, password)
        time.sleep(2)

        # Create New Drawing
        self.driver.find_element_by_xpath("//button[@class='btn btn-success btn-lg']").click()
        time.sleep(3)
        title = self.driver.find_element_by_xpath("//a[contains(text(),'Untitled')]")
        self.actions.double_click(title).perform()
        self.driver.find_element_by_xpath("//input[@class='form-control form-control-md']").click()
        self.driver.find_element_by_xpath("//input[@class='form-control form-control-md']").send_keys("NEW DRAWING")
        time.sleep(5)

        # Check Drawing
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(6)
        checker = self.driver.find_element_by_xpath("//div[@class='home container']//div[1]//article[1]//div[1]//h4[1]")\
            .text
        if checker == "NEW DRAWING":
            is_true = True
        else:
            is_true = False
        self.assertTrue(is_true)

        # Delete file after checking
        self.driver.find_element_by_xpath("//div[@class='home container']//div[1]//article[1]"
                                          "//div[1]//div[1]//button[1]").click()
        self.driver.find_element_by_xpath("//ul[@class='dropdown-menu show']//a[@class='dropdown-item"
                                          " text-danger'][contains(text(),'Delete')]").click()
        time.sleep(2)
        self.driver.find_element_by_xpath("//button[@class='btn btn-primary']").click()


if __name__ == '__main__':
    unittest.main()

