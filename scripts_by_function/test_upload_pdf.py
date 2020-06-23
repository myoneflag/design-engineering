import unittest
import time
from methods import methods
from selenium import webdriver

# This script tests uploading a pdf file

class test_upload(unittest.TestCase):

    test = methods()

    def setUp(self):
        self.driver = self.test.get_driver()
        time.sleep(25)
        #pass

    def tearDown(self):
        pass

    def test_uploadFile(self):
        username = "admin"
        password = "pleasechange"
        file = "D:\Work Files\PDFs\Residential Building Layout Floor Plan.pdf"

        # Login
        self.test.login(username, password)

        # Test file upload
        time.sleep(5)
        self.test.upload_pdf(file)

if __name__ == '__main__':
    unittest.main()

