import time
from methods import methods
from selenium import webdriver
from selenium.webdriver.common.keys import Keys

class login_class():

    getdriver = methods()

    def login(self):

        # Go to login page
        #driver.get("https://deploy.h2xengineering.com/login")

        # Enter username
        self.username = driver.find_element_by_xpath("//fieldset[1]//div[1]//div[1]//input[1]")
        username.send_keys("admin")

    # Enter password
    password = driver.find_element_by_xpath("//fieldset[2]//div[1]//div[1]//input[1]")
    password.send_keys("pleasechange")

    #Click login button
    login_button = driver.find_element_by_xpath("//button[@class='btn btn-success btn-lg']")
    login_button.click()

