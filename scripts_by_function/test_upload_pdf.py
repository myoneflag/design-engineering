import unittest
import time
from lib2to3.pgen2 import driver
from selenium.webdriver.support.wait import WebDriverWait
from methods import methods


# This script tests uploading a pdf file

class test_upload(unittest.TestCase):
    test = methods()

    def setUp(self):
        self.driver = self.test.get_driver()
        time.sleep(25)
        # pass

    def tearDown(self):
        pass

    def test_uploadFile(self):
        username = "admin"
        password = "pleasechange"
        file = "D:\Work Files\PDFs\pdf.pdf"
        # file = "D:\Work Files\PDFs\pdf.txt"

        # Login
        self.test.login(username, password)

        # Test file upload
        time.sleep(3)
        self.test.upload_pdf(file)
        try:
            time.sleep(1)
            self.driver.find_element_by_xpath("//header[@class='toast-header']")
            not_found = False
        except:
            not_found = True

        self.assertTrue(not_found)

if __name__ == '__main__':
    unittest.main()
