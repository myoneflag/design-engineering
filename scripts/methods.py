from selenium.webdriver import Chrome
from selenium import webdriver
import time
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import os
import platform


class methods():

    def get_driver(self):
        # Drivers listed below. Uncomment which driver you want to use.
        self.working_directory = os.getcwd()
        self.plt = platform.system()

        if self.plt == "Windows":
            self.driver = webdriver.Chrome(
                executable_path=self.working_directory + "/chromedriver_win32/chromedriver.exe")
            # self.driver = webdriver.Firefox(executable_path= self.working_directory + "/geckodriver-v0.26.0-win64/geckodriver.exe")
            # self.driver = webdriver.Edge(executable_path= self.working_directory + "/edgedriver_win64/msedgedriver.exe")
        elif self.plt == "Linux":
            self.driver = webdriver.Chrome(
                executable_path=self.working_directory + "/chromedriver_linux64/chromedriver")
            # self.driver = webdriver.Firefox(executable_path= self.working_directory + "/geckodriver-v0.26.0-win64/geckodriver.exe")
            # self.driver = webdriver.Edge(executable_path= self.working_directory + "/edgedriver_win64/msedgedriver.exe")
        elif self.plt == "Darwin":
            self.driver = webdriver.Chrome(
                executable_path=self.working_directory + "/chromedriver_mac64/chromedriver")
            # self.driver = webdriver.Firefox(executable_path= self.working_directory + "/geckodriver-v0.26.0-win64/geckodriver.exe")
            # self.driver = webdriver.Edge(executable_path= self.working_directory + "/edgedriver_win64/msedgedriver.exe")
        else:
            print("Unidentified system")

        self.driver.maximize_window()
        self.driver.get("https://deploy.h2xengineering.com/login")
        self.actions = ActionChains(self.driver)
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
        time.sleep(7)
        self.driver.find_element_by_xpath("//input[@name='name']")\
            .send_keys(file)

    def export_all_levels(self):

        # Click Results button
        time.sleep(2)
        self.driver.find_element_by_xpath("//button[@class='btn modebtn results btn-sm btn-outline-dark']").click()
        time.sleep(1)

        # Click Filters button to close it
        self.driver.find_element_by_xpath("/html/body/div/div/div/div[1]/div[1]/div/div/button").click()

        # Click Export button
        self.driver.find_element_by_xpath("//button[@class='btn dropdown-toggle btn-outline-dark btn-sm']").click()
        time.sleep(2)

        # Click PDF button
        # self.driver.find_element_by_partial_link_text("PDF").click()
        self.driver.find_element_by_xpath("//a[@class='dropdown-item text-outline-dark']").click()
        time.sleep(3)

        # Click export all button
        self.driver.find_element_by_id("export-all-pdf-btn").click()

    def export_by_level(self):
        # Click Results button
        time.sleep(2)
        self.driver.find_element_by_xpath("//button[@class='btn modebtn results btn-sm btn-outline-dark']").click()
        time.sleep(1)

        # Click Filters button to close it
        self.driver.find_element_by_xpath("/html/body/div/div/div/div[1]/div[1]/div/div/button").click()

        # Click Export button
        self.driver.find_element_by_xpath("//button[@class='btn dropdown-toggle btn-outline-dark btn-sm']").click()
        time.sleep(2)

        # Click PDF button
        self.driver.find_element_by_xpath("//a[@class='dropdown-item text-outline-dark']").click()
        time.sleep(3)

        # Click Export This Level
        self.driver.find_element_by_xpath("/html/body/div/div/div/div/div[1]/div[5]/div/button[1]").click()
        time.sleep(1)

    def create_drawing(self):
        self.driver.find_element_by_xpath("//button[@class='btn btn-success btn-lg']").click()
        time.sleep(5)
        title = self.driver.find_element_by_xpath("//a[contains(text(),'Untitled')]")
        self.actions.double_click(title).perform()
        self.driver.find_element_by_xpath("//input[@class='form-control form-control-md']").click()
        self.driver.find_element_by_xpath("//input[@class='form-control form-control-md']").send_keys("NEW DRAWING")

    def delete_drawing(self):
        self.driver.find_element_by_xpath("//div[@class='home container']//div[1]//article[1]//div[1]//div[1]//button[1]")\
            .click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//ul[@class='dropdown-menu show']//a[@class='dropdown-item text-danger'][contains(text(),'Delete')]").click()
        time.sleep(2)
        self.driver.find_element_by_xpath("//button[@class='btn btn-primary']").click()

    def signup_with_username(self, username):

        self.username = username

        # Click signup button
        self.driver.find_element_by_xpath("/html/body/div/div/div/div/div/div/div/form/fieldset[4]/div/button").click()
        time.sleep(7)

        # Input First Name
        self.driver.find_element_by_xpath("//fieldset[1]//div[1]//div[1]//input[1]")\
            .send_keys("Test")

        # Input Last Name
        self.driver.find_element_by_xpath("//fieldset[2]//div[1]//div[1]//input[1]")\
            .send_keys("User")

        # Input Username
        self.driver.find_element_by_xpath("//fieldset[3]//div[1]//div[1]//input[1]")\
            .send_keys(username)

        # Input Email
        self.driver.find_element_by_xpath("//fieldset[4]//div[1]//div[1]//input[1]")\
            .send_keys("test@email.com")

        # Input Password
        self.driver.find_element_by_xpath("//fieldset[5]//div[1]//div[1]//input[1]")\
            .send_keys("password")

        # Confirm Password
        self.driver.find_element_by_xpath("//fieldset[6]//div[1]//div[1]//input[1]") \
            .send_keys("password")

        # Click Create Account
        self.driver.find_element_by_xpath("//button[@class='btn btn-success']").click()

    def logout(self):
        self.driver.find_element_by_xpath("/html/body/div/div/span/nav/ul[3]/li[2]/a").click()
        self.driver.find_element_by_xpath("/html/body/div/div/span/nav/ul[3]/li[2]/ul/li[7]/a").click()

    def add_tmv_element(self):
        self.driver.find_element_by_xpath("//button[@class='btn modebtn pipes btn-sm btn-outline-dark']").click()
        time.sleep(1)
        self.driver.find_element_by_xpath("//button[@class='btn insertBtn tmv btn-sm btn-outline-dark']").click()
        self.driver.find_element_by_xpath("//div[@class='fullFrame']//canvas").click()
        webdriver.ActionChains(self.driver).send_keys(Keys.ESCAPE).perform()



