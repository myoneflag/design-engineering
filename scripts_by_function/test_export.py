import unittest
from methods import methods
import time
import os.path

# This script tests exporting a drawing file

class test_export(unittest.TestCase):

    test = methods()

    def setUp(self):
        self.driver = self.test.get_driver()
        time.sleep(25)
        # pass

    def tearDown(self):
        time.sleep(2)
        self.driver.close()
        pass

    def test_exportFile(self):
        username = "admin"
        password = "pleasechange"
        file_to_upload = "D:/Work Files/PDFs/pdf.pdf"
        exported_file = "C:/Users/Admin/Downloads/Untitled.pdf"

        # Login
        self.test.login_by_button_click(username, password)

        # File upload
        time.sleep(3)
        self.test.upload_pdf(file_to_upload)
        time.sleep(10)
        print (self.driver.current_url)

        # Export file
        self.test.export_all_levels()
        time.sleep(5)

        # Validate file exists. Change path to where downloads is located.
        try:
            os.path.exists(exported_file)
            exists = True
        except:
            exists = False

        self.assertTrue(exists)
        os.remove(exported_file)


if __name__ == '__main__':
    unittest.main()