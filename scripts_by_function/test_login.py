import unittest
import time
from methods import methods

# This script tests login page

class test_loginPage(unittest.TestCase):

    test = methods()

    def setUp(self):
        self.driver = self.test.get_driver()
        time.sleep(25)
        #pass

    def tearDown(self):
        #self.driver.close()
        pass

    def test_login(self):
        username = "admin"
        password = "pleasechange"
        self.test.login(username,password)
        time.sleep(2)
        self.assertTrue(self.driver.find_element_by_class_name("title"))

if __name__ == '__main__':
    unittest.main()

