from selenium import webdriver
import time
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains


class methods():

    def get_driver(self):
        # Drivers listed below. Uncomment which driver you want to use.
        # driver = webdriver.Chrome(executable_path="D:\Work Files\Drivers\chromedriver_win32\chromedriver.exe")
        # driver = webdriver.Firefox(executable_path="D:\Work Files\Drivers\geckodriver-v0.26.0-win64\geckodriver.exe")
        self.driver = webdriver.Edge(executable_path="D:\Work Files\Drivers\edgedriver_win64\msedgedriver.exe")
        self.driver.get("https://deploy.h2xengineering.com/login")
        return self.driver

    def login_by_button_click(self, username, password):
        self.username = username
        self.password = password

        # Enter username
        self.driver.find_element_by_xpath("//fieldset[1]//div[1]//div[1]//input[1]").send_keys(self.username)

        # Enter password
        self.driver.find_element_by_xpath("//fieldset[2]//div[1]//div[1]//input[1]").send_keys(self.password)

        # Click login button
        self.driver.find_element_by_xpath("//button[@class='btn btn-success btn-lg']").click()

    def login_by_enter_key(self, username, password):
        self.username = username
        self.password = password

        # Enter username
        self.driver.find_element_by_xpath("//fieldset[1]//div[1]//div[1]//input[1]").send_keys(self.username)

        # Enter password
        self.driver.find_element_by_xpath("//fieldset[2]//div[1]//div[1]//input[1]").send_keys(self.password)

        # Press Enter Key
        self.driver.find_element_by_xpath("//fieldset[2]//div[1]//div[1]//input[1]").send_keys(Keys.ENTER)

    def upload_pdf(self, file):
        self.file = file

        # Click new Drawing button
        self.driver.find_element_by_xpath("//button[@class='btn btn-success btn-lg']").click()

        # Upload file
        time.sleep(5)
        self.driver.find_element_by_xpath("//input[@name='name']").send_keys(file)

    def export_all_levels(self):

        # Click Results button
        time.sleep(2)
        self.driver.find_element_by_xpath("//button[@class='btn modebtn results btn-sm btn-outline-dark']"
                                          "//*[local-name()='svg']").click()
        time.sleep(1)

        # Click Filters button to close it
        self.driver.find_element_by_css_selector("div.calculationSidePanel.container:nth-child(1) div.row div.col div"
                                                 ".btn-group > button.btn.calculationBtn.btn-outline-dark").click()

        # Click Export button
        self.driver.find_element_by_xpath("//button[@class='btn dropdown-toggle btn-outline-dark btn-sm']").click()
        time.sleep(1)

        # Click PDF button
        self.driver.find_element_by_partial_link_text("PDF").click()
        time.sleep(3)

        # Click export all button
        self.driver.find_element_by_id("export-all-pdf-btn").click()



