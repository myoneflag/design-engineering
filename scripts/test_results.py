import unittest
from methods import methods
import time
import os.path
from selenium.webdriver.common.action_chains import ActionChains
from pathlib import Path
from selenium.webdriver.common.keys import Keys

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

        # Go to Home page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(7)

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

        # Go to Home page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(7)

        # Delete drawing
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing successfully deleted!")
        time.sleep(3)

        # End
        print("Export By Level Test Complete!\n----------------")

    def test_filters(self):
        # Tests filters button if checkboxes are working.

        username = "admin"
        password = "pleasechange"

        # Start
        print("----------------\nStart Export By Level Test...")

        # Login
        print("Logging in...")
        self.test.login_by_button_click(username, password)
        print("Login Successful!")
        time.sleep(5)

        # Create new drawing
        print("Creating drawing...")
        self.test.create_drawing()
        print("Creation successful!")
        time.sleep(3)

        # Click Plumbing button and Add TMV element to canvas
        print("Adding TMV element to canvas...")
        self.test.add_tmv_element()
        print("TMV element added!")
        time.sleep(2)

        # Check Results Filter
        print("Checking filters...")
        self.driver.find_element_by_xpath("//button[@class='btn modebtn results btn-sm btn-outline-dark']").click()

        tmv_valve_checkbox = self.driver.find_element_by_xpath("//div[@class='filterPanel']//div[1]//div[1]//input[1]")
        warm_water_pressure_checkbox = self.driver.find_element_by_xpath("//div[@class='filterPanel']//div[1]//div[2]//input[1]")
        cold_water_pressure_checkbox = self.driver.find_element_by_xpath("//div[@class='filterPanel']//div[1]//div[3]//input[1]")
        inlet_outlet_checkbox = self.driver.find_element_by_xpath("//div[@class='row']//div[2]//div[1]//input[1]")
        pressure_checkbox = self.driver.find_element_by_xpath("//div[@class='row']//div[2]//div[2]//input[1]")
        static_pressure_checkbox = self.driver.find_element_by_xpath("//div[@class='row']//div[2]//div[3]//input[1]")
        flowrate_checkbox = self.driver.find_element_by_xpath("//div[4]//input[1]")
        loading_units_checkbox = self.driver.find_element_by_xpath("//div[5]//input[1]")


        print("Checking TMV Valves checkboxes...")
        self.assertTrue(warm_water_pressure_checkbox.is_enabled())
        print("Warm water pressure drop enabled...")
        self.driver.find_element_by_xpath("//label[contains(text(),'Warm Water Pressure Drop')]").click()
        self.assertFalse(warm_water_pressure_checkbox.is_selected())
        print("Warm water pressure drop unchecked...")
        self.driver.find_element_by_xpath("//label[contains(text(),'Warm Water Pressure Drop')]").click()
        self.assertTrue(warm_water_pressure_checkbox.is_selected())
        print("Warm water pressure drop checked...")
        self.assertTrue(cold_water_pressure_checkbox.is_enabled())
        print("Cold water pressure drop enabled...")
        self.driver.find_element_by_xpath("//label[contains(text(),'Cold Water Pressure Drop')]").click()
        self.assertFalse(cold_water_pressure_checkbox.is_selected())
        print("Cold water pressure drop unchecked...")
        self.driver.find_element_by_xpath("//label[contains(text(),'Cold Water Pressure Drop')]").click()
        self.assertTrue(cold_water_pressure_checkbox.is_selected())
        print("Cold water pressure drop checked...")
        print("Disabling TMV Valve checkboxes...")
        self.driver.find_element_by_xpath("//div[@class='filterPanel']//div[1]//div[1]//label[1]").click()
        self.assertFalse(tmv_valve_checkbox.is_selected())
        print("TMV Valve checkbox unchecked...")
        self.assertFalse(warm_water_pressure_checkbox.is_enabled())
        self.assertFalse(cold_water_pressure_checkbox.is_enabled())
        print("TMV Valve checkboxes disabled...")
        self.driver.find_element_by_xpath("//div[@class='filterPanel']//div[1]//div[1]//label[1]").click()
        self.assertTrue(tmv_valve_checkbox.is_selected())
        print("TMV Valve checked...")
        self.assertTrue(warm_water_pressure_checkbox.is_enabled())
        self.assertTrue(cold_water_pressure_checkbox.is_enabled())
        print("TMV Valve checkboxes enabled...")

        print("Checking Inlet/Outlet Checkboxes...")
        self.assertFalse(inlet_outlet_checkbox.is_selected())
        print("Inlet/Outlet is disabled...")
        self.assertFalse(pressure_checkbox.is_enabled())
        print("Pressure checkbox is disabled...")
        self.assertFalse(static_pressure_checkbox.is_enabled())
        print("Static Pressure checkbox is disabled...")
        self.assertFalse(flowrate_checkbox.is_enabled())
        print("Flow Rate checkbox is disabled...")
        self.assertFalse(loading_units_checkbox.is_enabled())
        print("Loading Units checkbox is disabled...")

        print("Enabling Inlet/Outlet Checkboxes...")
        self.driver.find_element_by_xpath("//div[@class='row']//div[2]//div[1]//label[1]").click()
        self.assertTrue(inlet_outlet_checkbox.is_selected())
        print("Inlet/Outlet checkbox enabled...")
        self.assertTrue(pressure_checkbox.is_enabled())
        print("Pressure checkbox enabled...")
        self.driver.find_element_by_xpath("//div[@class='row']//div[2]//div[2]//label[1]").click()
        self.assertTrue(pressure_checkbox.is_selected())
        print("Pressure checkbox checked...")
        self.assertTrue(static_pressure_checkbox.is_enabled())
        print("Static Pressure checkbox enabled...")
        self.driver.find_element_by_xpath("//label[contains(text(),'Static Pressure')]").click()
        self.assertTrue(static_pressure_checkbox.is_selected())
        print("Static Pressure checkbox checked...")
        self.assertTrue(flowrate_checkbox.is_enabled())
        print("Flow rate checkbox is enabled...")
        self.driver.find_element_by_xpath("//label[contains(text(),'Flow Rate')]").click()
        self.assertTrue(flowrate_checkbox.is_selected())
        print("Flow rate checkbox is checked...")
        self.assertTrue(loading_units_checkbox.is_enabled())
        print("Loading Units checkbox is enabled...")
        self.driver.find_element_by_xpath("//label[contains(text(),'Loading Units')]").click()
        self.assertTrue(loading_units_checkbox.is_selected())
        print("Loading Units checkbox is checked...")
        time.sleep(1)
        print("Checking of filters successful!")

        # Go to Home page
        self.driver.find_element_by_xpath("//a[contains(text(),'Home')]").click()
        time.sleep(3)

        # Delete drawing after checking
        print("Deleting drawing...")
        self.test.delete_drawing()
        print("Drawing deleted!")
        time.sleep(3)

        # End
        print("Filters Test Complete!\n----------------")

if __name__ == '__main__':
    unittest.main()