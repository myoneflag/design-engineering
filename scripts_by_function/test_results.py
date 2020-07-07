import unittest
from methods import methods
import time
import os.path
from selenium.webdriver.common.action_chains import ActionChains
from pathlib import Path

class test_results(unittest.TestCase):

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

    def test_export_all_levels(self):

        # Tests exporting all levels

        username = "admin"
        password = "pleasechange"
        file_to_upload = os.getcwd() + "/pdf.pdf"
        path_to_downloads = str(os.path.join(Path.home(), "Downloads"))
        exported_file = path_to_downloads + "/Untitled.pdf"

        # Start
        print("----------------\nStart Export All Levels Test...")

        # Login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        print("Login Successful!")
        time.sleep(5)

        # Create New drawing and upload file
        print("Creating drawing and uploading pdf...")
        self.test.upload_pdf(file_to_upload)
        print("Upload successful!")
        time.sleep(5)

        # Export all levels
        print("Exporting all levels...")
        self.test.export_all_levels()
        print("Export all levels successful!")
        time.sleep(5)

        # Validate file exists. Change path to where downloads is located.
        print("Validating exported file...")
        try:
            os.path.exists(exported_file)
            exists = True
        except:
            exists = False

        self.assertTrue(exists)
        os.remove(exported_file)
        print("Exported file exists and already deleted!")

        # Delete drawing
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing successfully deleted!")
        time.sleep(3)

        # End
        print("Export All Levels Test Complete!\n----------------")

    def test_export_by_level(self):
        # Tests exporting by level (Ground)

        username = "admin"
        password = "pleasechange"
        file_to_upload = os.getcwd() + "/pdf.pdf"
        path_to_downloads = str(os.path.join(Path.home(), "Downloads"))
        exported_file = path_to_downloads + "/Untitled - -Ground Floor.pdf"

        # Start
        print("----------------\nStart Export By Level Test...")

        # Login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        print("Login Successful!")
        time.sleep(5)

        # Create New drawing and upload file
        print("Creating drawing and uploading pdf...")
        self.test.upload_pdf(file_to_upload)
        print("Upload successful!")
        time.sleep(5)

        # Export ground level
        print("Exporting ground level...")
        self.test.export_by_level()
        print("Export ground level successful!")
        time.sleep(5)

        # Validate file exists. Change path to where downloads is located.
        print("Validating exported file...")
        try:
            os.path.exists(exported_file)
            exists = True
        except:
            exists = False

        self.assertTrue(exists)
        os.remove(exported_file)
        print("Exported file exists and already deleted!")

        # Delete drawing
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing successfully deleted!")
        time.sleep(3)

        # End
        print("Export By Level Test Complete!\n----------------")


if __name__ == '__main__':
    unittest.main()