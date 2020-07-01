import unittest
import time
from selenium.webdriver.common.action_chains import ActionChains
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
        file = "D:\Work Files\PDFs\pdf.pdf"

        # Uncomment line below for invalid upload. Also Change path to where pdf.txt is located
        # file = "D:\Work Files\PDFs\pdf.txt"

        # Start
        print("----------------\nStart Upload PDF Test...")

        # Login
        print("Logging in...")
        self.test.login_by_button_click(username, password)

        # Test file upload
        time.sleep(3)
        print("Uploading file...")
        self.test.upload_pdf(file)
        try:
            time.sleep(1)
            self.driver.find_element_by_xpath("//header[@class='toast-header']")
            not_found = False
        except:
            not_found = True

        self.assertTrue(not_found)
        print("File Successfully uploaded!")
        print("Upload PDFTest Complete!\n----------------")

    def test_replace_pdf(self):
        username = "admin"
        password = "pleasechange"

        # Uncomment line below for valid upload. Also Change path to where pdf.pdf is located
        file = "D:\Work Files\PDFs\pdf.pdf"

        # Replacement file
        file_2 = "D:/Work Files/PDFs/pdf-test.pdf"

        # Start
        print("----------------\nStart Replace PDF Test...")

        # Login
        print("Logging in...")
        self.test.login_by_button_click(username, password)

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
        time.sleep(5)

        # Check for error
        try:
            time.sleep(1)
            self.driver.find_element_by_xpath("//header[@class='toast-header']")
            not_found = False
        except:
            not_found = True

        self.assertTrue(not_found)
        print("PDF successfully replaced!")
        print("Replace PDF Test Complete!\n----------------")



if __name__ == '__main__':
    unittest.main()
