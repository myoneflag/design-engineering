import unittest
import time
from methods import methods
from selenium import webdriver

# This script tests login page

class test_loginPage(unittest.TestCase):

    getdriver = methods()

    def setUp(self):
        self.driver = self.getdriver.get_driver()
        self.driver.get("https://deploy.h2xengineering.com/login")
        pass

    def tearDown(self):
        #self.driver.close()
        pass

    def test_login(self):

        # Enter username
        time.sleep(20)
        self.username = self.driver.find_element_by_xpath("//fieldset[1]//div[1]//div[1]//input[1]")
        self.username.send_keys("admin")

        # Enter password
        self.password = self.driver.find_element_by_xpath("//fieldset[2]//div[1]//div[1]//input[1]")
        self.password.send_keys("pleasechange")

        # Click login button
        self.login_button = self.driver.find_element_by_xpath("//button[@class='btn btn-success btn-lg']")
        self.login_button.click()

        time.sleep(2)
        self.assertTrue(self.driver.find_element_by_id("email-verification"))


if __name__ == '__main__':
    unittest.main()

