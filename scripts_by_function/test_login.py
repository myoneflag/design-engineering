import unittest
import time
from methods import methods

# This script tests login page

class test_loginPage(unittest.TestCase):

    test = methods()

    def setUp(self):
        self.driver = self.test.get_driver()
        time.sleep(25)
        # pass

    def tearDown(self):
        time.sleep(2)
        self.driver.close()
        # pass

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

if __name__ == '__main__':
    unittest.main()

