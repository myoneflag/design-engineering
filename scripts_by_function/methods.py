from selenium import webdriver
import time

class methods():

    def get_driver(self):
        # Drivers listed below. Uncomment which driver you want to use.
        # driver = webdriver.Chrome(executable_path="D:\Work Files\Drivers\chromedriver_win32\chromedriver.exe")
        # driver = webdriver.Firefox(executable_path="D:\Work Files\Drivers\geckodriver-v0.26.0-win64\geckodriver.exe")
        self.driver = webdriver.Edge(executable_path="D:\Work Files\Drivers\edgedriver_win64\msedgedriver.exe")
        self.driver.get("https://deploy.h2xengineering.com/login")
        return self.driver

    def login(self, username, password):
        self.username = username
        self.password = password

        # Enter username
        self.driver.find_element_by_xpath("//fieldset[1]//div[1]//div[1]//input[1]").send_keys(self.username)

        # Enter password
        self.driver.find_element_by_xpath("//fieldset[2]//div[1]//div[1]//input[1]").send_keys(self.password)

        # Click login button
        self.driver.find_element_by_xpath("//button[@class='btn btn-success btn-lg']").click()

    def upload_pdf(self, file):
        self.file = file

        # Click new Drawing button
        self.driver.find_element_by_xpath("//button[@class='btn btn-success btn-lg']").click()

        # Upload file
        time.sleep(5)
        self.driver.find_element_by_xpath("//input[@name='name']").send_keys(file)

