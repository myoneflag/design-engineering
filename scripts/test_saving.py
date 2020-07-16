import unittest
from methods import methods
from selenium.webdriver.common.action_chains import ActionChains
import time

class test_saving(unittest.TestCase):

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

    def test_save(self):
        # Tests saving of changes

        username = "admin"
        password = "pleasechange"

        # Start
        print("----------------\nStart Saving Test...")

        # Perform login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        time.sleep(2)
        print("Login successful!")

        # Create new drawing
        print("Creating drawing...")
        self.test.create_drawing()
        time.sleep(3)
        print("Creation successful!")

        # Check drawing name if saved
        print("Opening created drawing...")
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(5)
        self.driver.find_element_by_xpath("//body/div/div/div[@class='isEmailVerification']/div[@class='home container']"
                                          "/div[@class='row']/div[1]/article[1]/div[1]/div[1]/a[1]").click()
        time.sleep(3)
        print("Opening drawing successful!")
        print("Checking drawing name...")
        title_checker = self.driver.find_element_by_xpath("//a[contains(text(),'NEW DRAWING')]").get_attribute("title")
        self.assertEqual(title_checker, "NEW DRAWING")
        if title_checker == "NEW DRAWING":
            print("Changes saved!")
        else:
            print("Changes not saved!")

        # Go to Home page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(7)

        # Delete drawing
        print("Deleting created drawing...")
        time.sleep(5)
        self.test.delete_drawing()
        print("Drawing successfully deleted!")

        # End
        print("Saving Test Complete!\n----------------")

if __name__ == '__main__':
    unittest.main()