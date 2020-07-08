import unittest
from methods import methods
from selenium.webdriver.common.action_chains import ActionChains
import time

class test_signup(unittest.TestCase):
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

    def test_signup(self):

        # Test signup page

        # Start
        print("----------------\nStart Signup Test...")

        # Perform Signup
        print("Signing up...")

        # ENTER CODE HERE

        print("Signup successful!")

        # End
        print("Signup Test Complete!\n----------------")

if __name__ == '__main__':
    unittest.main()